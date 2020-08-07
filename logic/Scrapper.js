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
  static #lastUser = {
    userId: null,
    status: {},
  };

  static async performAction(actionName, token) {
    if (this.#isGlobalBrowserSet) {
      try {
        let userId = getUserIdFromToken(token);
        //check if there was a previous user
        if (this.#lastUser.userId != userId && this.#lastUser.userId != null) {
          //if were - logout
          this.#logOut();
          this.#page.close();
        }
        //check if there was a previous user, we are assuming that if he were then he is logged out
        if (this.#lastUser.userId != userId) {
          //if were - log in
          let credentials = await this.#getCredentials(userId);
          let result = await this.#logIn(credentials);
          //after succesful login write down current user id and his account status
          this.#lastUser.userId = userId;
          if (result) {
            this.#lastUser.status = await this.#scrapAccountStatus();
          }
        }
        let result = await this.#performActualAction(actionName);
        return result;
      } catch (err) {
        console.log("\nError:\n", err);
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
      let result = await this.#logIn(credentials);
      if (result) {
        await this.#logOut();
      }
      return result;
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
    await this.#page.goto("https://gpwtrader.pl/?showlogin=true");
    //await this.#page.click(".zaloguj");
    //await this.#page.waitForNavigation();
    let result = await this.#page.evaluate((credentials) => {
      document.querySelector("#login").value = credentials.email;
      document.querySelector("#password").value = credentials.password;
      document.querySelector(".signin-btn").click();
      var errorText = document.querySelector(".errors").textContent;
      if (errorText === "") {
        return false;
      } else {
        return true;
      }
    }, credentials);
    if (!result) {
      await this.#page.waitForNavigation();
    }
    return result;
  };

  static #logOut = async () => {
    await this.#page.goto("https://gpwtrader.pl/");
    await this.#page.click(".logout > a");
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

  static #performActualAction = async (actionName) => {
    switch (actionName) {
      case "GET-COMPANIES":
        return await this.#scrapCompanies();
      case "GET-BOUGHT-SHARES":
        return await this.#scrapUserBoughtShares();
      default:
        console.log("This action is not supported!");
    }
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
    let shares = await this.#page.evaluate(() => {
      return Array.from($(".derywaty-data > .universal-table > tbody > tr"))
        .filter((row) => row.childNodes.length > 5)
        .map((tr) => {
          let params = tr.textContent
            .replace(/\s{2,}/g, "-")
            .split("-")
            .filter((param) => param);

          let obj = {};
          obj[params[0]] = params.slice(1);
          return obj;
        });
    });
    return { header, shares };
  };

  //TODO rethink this getter, kinda pointless if
  static #getAccountStatus = () => {
    if (this.#lastUser.userId != null) {
      return this.#lastUser.status;
    } else {
      return {
        resources: 0,
        wallet: 0,
        rate: "0%",
      };
    }
  };

  static #openBrowser = async () => {
    const browser = await puppeteer.launch({ headless: false }); //change to true to hide window
    return browser;
  };

  static #openPage = async () => {
    //browser is global.browser variable
    const page = await global.browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0"
    );

    return page;
  };

  static #getCredentials = async (userId) => {
    let credentials = await CredentialsModel.find({ userId });
    let { email, password } = credentials[0];
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
