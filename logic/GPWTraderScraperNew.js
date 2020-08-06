const puppeteer = require("puppeteer");
const JWT = require("jsonwebtoken");
const AccessGPWTCredentials = require("../database/AccessGPWTCredentials");
const credentialsDB = new AccessGPWTCredentials();

/**
 * on init:
 * open browser, get on landing page
 *
 * on request get token, check if token is valid, get data to login and do action
 */

class GPWTScrapper {
  #browser;
  #page;
  #lastUser = {
    userId: null,
    status: {},
  };
  constructor() {
    this.initializeBrowserAndPage();
  }

  initializeBrowserAndPage() {
    this.#openBrowser().then((browser) => {
      this.#browser = browser;
      this.#openPage().then((page) => {
        this.#page = page;
      });
    });
  }

  async performAction(actionName, token) {
    let userId = getUserIdFromToken(token);
    //check if there was a previous user
    if (this.#lastUser.userId != userId && this.#lastUser.userId != null) {
      //if were - logout
      this.logOut();
    }
    //check if there was a previous user, we are assuming that if he were then he is logged out
    if (this.#lastUser.userId != userId) {
      //if were - log in
      let credentials = await getCredentialsFromDB(userId);
      await this.logIn(credentials);
      //after succesful login write down current user id and his account status
      this.#lastUser.userId = userId;
      this.#lastUser.status = await this.#scrapAccountStatus();
    }
    let result = await this.#performActualAction(actionName);
  }

  async testCredentials(credentials) {
    console.log(credentials);
    let result = await this.logIn(credentials);
    if (result) {
      await this.logOut();
    }
    return result;
  }

  async logIn(credentials) {
    await this.#page.goto("https://gpwtrader.pl/");
    await this.#page.click(".zaloguj");

    let result = await this.#page.evaluate((credentials) => {
      document.querySelector("#login").value = credentials.login;
      document.querySelector("#password").value = credentials.password;
      document.querySelector(".signin-btn").click();
      var errorText = document.querySelector(".errors").textContent;
      if (errorText === "") {
        return false;
      } else {
        return true;
      }
    }, credentials);
    if (result) {
      await this.#page.waitForNavigation();
    }
    return result;
  }

  async logOut() {
    await this.#page.goto("https://gpwtrader.pl/");
    await this.#page.click(".logout > a");
  }

  /**
   * Gets status parameters from current page, we're assuming that user is logged in and on main page
   * Parameters that we're scrapping:
   * account cash balance - resources
   * cash ballance + current portfolio priced out - wallet
   * percentage of profit/loss - rate
   */
  #scrapAccountStatus = async () => {
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

  #performActualAction = async (actionName) => {
    switch (actionName) {
      case "GET-COMPANIES":
        return await this.#scrapCompanies();
      case "GET-BOUGHT-SHARES":
        return await this.#scrapUserBoughtShares();
      default:
        console.log("This action is not supported!");
    }
  };

  #scrapCompanies = async () => {
    await this.#page.goto("https://gpwtrader.pl/quotes/shares");
    await this.#page.waitForNavigation();

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

  #scrapUserBoughtShares = async () => {
    await this.#page.goto("https://gpwtrader.pl/account");

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
  #getAccountStatus = () => {
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

  #openBrowser = async () => {
    const browser = await puppeteer.launch({ headless: true });
    return browser;
  };

  #openPage = async () => {
    const page = await this.#browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0"
    );

    return page;
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

async function getCredentialsFromDB(userId) {
  //get credentials for GPWTrader from database
  let credentials = credentialsDB.getCredentials(userId);
  return credentials;
}

module.exports = { GPWTScrapper, getUserIdFromToken, getCredentialsFromDB };
