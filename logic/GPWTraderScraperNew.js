const puppeteer = require("puppeteer");

/**
 * on init:
 * open browser, get on landing page
 *
 * on request get token, check if token is valid, get data to login and do action
 */
async function openBrowser() {
  const browser = await puppeteer.launch({ headless: true });
  return browser;
}

async function logIn(token) {
  //check if token is valid
}
