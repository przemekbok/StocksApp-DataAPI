const puppeteer = require("puppeteer");
const JWT = require("jsonwebtoken");
const AccessGPWTCredentials = require("../database/AccessGPWTCredentials");

/**
 * on init:
 * open browser, get on landing page
 *
 * on request get token, check if token is valid, get data to login and do action
 */

export default class GPWTScrapper {
  #browser;
  #page;
  #lastUser = {
    userId: null,
    status: {},
  };
  constructor() {
    this.#browser = openBrowser();
    this.#page = openPage(this.#browser);
  }

  performAction(actionName,token) {
    let userId = getUserIdFromToken(token);
    if (this.#lastUser.userId == null || this.#lastUser.userId != userId) {
        if(this.#lastUser.userId != userId && !isNaN(userId)){
            await this.#page.evaluate(() => {
                document.querySelector("#login").value = credentials.login;
                document.querySelector("#password").value = credentials.password;
                document.querySelector(".signin-btn").click();
              });
        }
      let credentials = await getCredentialsFromDB(userId);
      await this.logIn(credentials);
      this.#lastUser.userId = userId;
      this.#lastUser.status = await getAccountStatus();
    }
    await chooseAction(actionName);
  }

  async logIn(credentials) {
    await this.#page.goto("https://gpwtrader.pl/");
    await this.#page.click(".zaloguj");

    await this.#page.evaluate(() => {
      document.querySelector("#login").value = credentials.login;
      document.querySelector("#password").value = credentials.password;
      document.querySelector(".signin-btn").click();
    });
    await this.#page.waitForNavigation();
  }

  async getAccountStatus() {
    //evaluate account status data fetch
    let status = await this.#page.evaluate(() => {
      let resources = document.querySelector(".resources > p").innerText;
      let wallet = document.querySelector(".wallet > p").innerText;
      let rate = document.querySelector(".rate > p").innerText;
      return {
        resources,
        wallet,
        rate,
      };
    });
    return status;
  }

  async chooseAction(actionName){
    switch(actionName){
        case "GET-COMPANIES":
            return await this.getCompanies(); 
        case "GET-BOUGHT-SHARES":
            return await this.getBoughtShares();
        default:
            console.log("This action is not supported!")
    }
  }

  async getCompanies(){
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
  }

  async getBoughtShares(){
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
  }
}

async function openBrowser() {
  const browser = await puppeteer.launch({ headless: true });
  return browser;
}

async function openPage() {
  const page = await this.#browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0"
  );

  return page;
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
  let userId = decodedToken.payload.sub;
  return userId;
}

async function getCredentialsFromDB(useId) {
  //get credentials for GPWTrader from database
  let credentials = AccessGPWTCredentials.getCredentials(useId);
  return credentials;
}
