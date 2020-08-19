const puppeteer = require("puppeteer");
const JWT = require("jsonwebtoken");
const CredentialsModel = require("../models/User/UserGPWTCredentials");

/**
 * on init:
 * open browser, get on landing page
 *
 * on request get token, check if token is valid, get data to login and do action
 */

class GPWTScrapper {
  static #isGlobalBrowserSet = false;
  static #page;

  static async performAction(actionName, token, data) {
    if (this.#isGlobalBrowserSet) {
      try {
        let userId = getUserIdFromToken(token);
        let credentials = await this.#getCredentials(userId);
        let loginResult = await this.#logIn(credentials);
        let result = await this.#performActualAction(actionName, data);
        await this.#logOut();
        this.#page.close();
        return result;
      } catch (err) {
        console.log("\nError:\n", err);
        await this.#logOut();
        this.#page.close();
        //await this.performAction(actionName, token);
      }
    } else {
      //could make dispacher of some sort
      console.log("\nError:\n", "default browser is not set!");
    }
  }

  static async testCredentials(credentials) {
    if (this.#isGlobalBrowserSet) {
      try {
        let result = await this.#logIn(credentials);
        if (result) {
          await this.#logOut();
        }
        this.#page.close();
        return result;
      } catch (err) {
        this.#page.close();
        return false;
      }
    } else {
      console.log("\nError:\n", "default browser is not set!");
    }
  }

  static setDefaultBrowser(browser) {
    global.browser = browser;
    this.#isGlobalBrowserSet = true;
  }

  static #logIn = async (credentials) => {
    this.#page = await this.#openPage();
    await this.#page.goto("https://gpwtrader.pl/?showlogin=true", {
      waitUntil: "domcontentloaded",
    });
    //await this.#page.click(".zaloguj");
    //await this.#page.waitForNavigation();
    let result = await this.#page.evaluate((credentials) => {
      document.querySelector("#login").value = credentials.email;
      document.querySelector("#password").value = credentials.password;
      document.querySelector(".signin-btn").click();
      var errorText = document.querySelector(".errors").textContent;
      if (errorText === "") {
        return true;
      } else {
        return false;
      }
    }, credentials);
    if (result) {
      await this.#page.waitForNavigation();
    }
    return result;
  };

  static #logOut = async () => {
    //await this.#page.goto("https://gpwtrader.pl/");
    await this.#page.click(".logout > a");
  };

  static #performActualAction = async (actionName, data) => {
    switch (actionName) {
      case "GET-COMPANIES":
        return await this.#scrapCompanies();
      case "GET-BOUGHT-SHARES":
        return await this.#scrapUserBoughtShares();
      case "UPDATE-ALL":
        return await this.#scrapAllUserRelatedData();
      case "BUY-SHARES":
        return await this.#tradeShares(data, actionName);
      case "SELL-SHARES":
        return await this.#tradeShares(data, actionName);
      default:
        console.log("This action is not supported!");
    }
  };

  static #scrapAllUserRelatedData = async () => {
    let status = await this.#scrapAccountStatus();
    let boughtShares = await this.#scrapUserBoughtShares();
    let companies = await this.#scrapCompanies();
    return { status, boughtShares, companies };
  };

  /**
   * Gets status parameters from current page, we're assuming that user is logged in and on main page
   * Parameters that we're scrapping:
   * account cash balance - resources
   * cash ballance + current portfolio priced out - wallet
   * percentage of profit/loss - rate
   */
  static #scrapAccountStatus = async () => {
    //we're logged in and on https://gpwtrader.pl/
    let status = await this.#page.evaluate(() => {
      let resources = document.querySelector(".resources > p").innerText;
      let wallet = document.querySelector(".wallet > p").innerText;
      let rate = document.querySelector(".rate > p").innerText;
      //TODO - percentage is neutral - indicator needs to be added
      return {
        resources,
        wallet,
        rate,
      };
    });
    return status;
  };

  static #scrapCompanies = async () => {
    await this.#page.goto("https://gpwtrader.pl/quotes/shares");
    //await this.#page.waitForNavigation();

    let header = await this.#page.evaluate(() => {
      return Array.from($(".universal-table > thead > tr")[0].children).map(
        (tr) => {
          if ($("table", tr).length != 0) {
            let name = tr.childNodes[0].textContent
              .replace(/\s{2,}/g, "-")
              .split("-")
              .filter((word) => word);
            let content = Array.from($("tr >", tr)).map((td) => td.textContent);
            let obj = new Object();
            obj[name] = content;
            return obj;
          } else {
            return tr.textContent.replace(/\n|\s{2,}/g, "");
          }
        }
      );
    });

    let companies = await this.#page.evaluate(() => {
      return $(".universal-table > tbody > tr")
        .toArray()
        .map((tr) => {
          let isin = tr.attributes["data-isin"].nodeValue;
          let params = tr.textContent
            .replace(/\s+/g, "-")
            .split("-")
            .filter((param) => param);

          let obj = {};
          obj[isin] = params;
          return obj;
        });
    });

    return { header, companies };
  };

  static #scrapUserBoughtShares = async () => {
    await this.#page.goto("https://gpwtrader.pl/account");
    //await this.#page.waitForNavigation();
    let header = await this.#page.evaluate(() => {
      return Array.from($(".universal-table > thead > tr")[0].children).map(
        (tr) => {
          return tr.textContent.replace(/\n|\s{2,}/g, "");
        }
      );
    });
    header = header.filter((text) => text != header[1]); //filter header from unnecessary ones
    let shares = await this.#page.evaluate(() => {
      return Array.from($(".derywaty-data > .universal-table > tbody > tr"))
        .filter((row) => row.childNodes.length > 5)
        .map((tr) => {
          let isin = tr.querySelector("[data-isin]").attributes["data-isin"]
            .value;
          let params = tr.textContent
            .replace(/\s{2,}/g, "-")
            .split("-")
            .filter((param) => param);
          let name = params[0];
          params = params.slice(2); //filter from unnecessary name and params
          return { name, isin, params };
        });
    });
    if (shares[0].params.length < 6) {
      header = header.filter((text) => text != header[3]);
    }
    return { header, shares };
  };

  static #tradeShares = async (formData, type) => {
    await this.#page.goto("https://gpwtrader.pl/exchange-order");
    await this.#page.evaluate((formData) => {
      if (type === "BUY-SHARES") {
        document.querySelector(".button-kupno > a").click();
      } else if (type === "SELL-SHARES") {
        document.querySelector(".button-sprzedaz > a").click();
      }
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== "") {
          let tagName = document.querySelector(`#${key}`).tagName;
          if (tagName === "SELECT") {
            let option = document.querySelector(
              `#${key} > [value='${formData[key]}']`
            );
            console.log(option);
            option.selected = true;
          } else if (tagName === "INPUT") {
            document.querySelector(`#${key}`).value = formData[key];
          }
        }
      });
      document.querySelector(".button-zlecenie > a").click();
    }, formData);
    await this.#page.waitForNavigation();
    await this.#page.evaluate(() => {
      document.querySelector(".button-zlecenie > a").click();
    });
    await this.#page.waitForNavigation();
    let result = await this.#page.evaluate(() => {
      let errorElement = document.querySelector(".form-error");
      let errorMessage = errorElement ? errorElement.textContent : "";
      if (errorMessage !== "") {
        return { result: false, errorMessage };
      } else {
        return { result: true, errorMessage: "" };
      }
    });
    return result;
  };

  static #openPage = async () => {
    //browser is global.browser variable
    const page = await global.browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0"
    );
    await page.setDefaultNavigationTimeout(0);

    return page;
  };

  static #getCredentials = async (userId) => {
    let credentials = await CredentialsModel.find({ userId });
    credentials =
      credentials.length > 0 ? credentials[0] : { email: "", password: "" };
    let { email, password } = credentials;
    return { email, password };
  };
}

function getUserIdFromToken(token) {
  //check if token is valid and decode it
  let decodedToken;
  try {
    decodedToken = JWT.decode(token);
  } catch (error) {
    console.log(error);
  }
  //get user id
  let userId = decodedToken.sub;
  return userId;
}

module.exports = { GPWTScrapper, getUserIdFromToken };
