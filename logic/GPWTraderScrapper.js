const puppeteer = require("puppeteer");

var runningBrowsers = {};

async function initiateGPWTrader(browser) {
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0"
  );
  await page.goto("https://gpwtrader.pl/");
  await page.click(".zaloguj");

  await page.evaluate(() => {
    document.querySelector("#login").value = "rzx83803@zzrgg.com";
    document.querySelector("#password").value = "Kapitanbomba1$";
    document.querySelector(".signin-btn").click();
  });
  await page.waitForNavigation();

  //evaluate account status data fetch
  await page.evaluate(() => {
    let resources = document.querySelector(".resources > p").innerText;
    let wallet = document.querySelector(".wallet > p").innerText;
    let rate = document.querySelector(".rate > p").innerText;
    return {
      resources,
      wallet,
      rate,
    };
  });

  return page;
}

async function getCompanies() {
  const browser = await puppeteer.launch({ headless: true });
  let response = initiateGPWTrader(browser).then(async (page) => {
    await page.goto("https://gpwtrader.pl/quotes/shares");

    let header = await page.evaluate(() => {
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
    let companies = await page.evaluate(() => {
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
    await browser.close();
    return { header, companies };
  });
  return response;
}

async function getBoughtShares() {
  const browser = await puppeteer.launch({ headless: true });
  let response = initiateGPWTrader(browser).then(async (page) => {
    await page.goto("https://gpwtrader.pl/account");
    let header = await page.evaluate(() => {
      return Array.from($(".universal-table > thead > tr")[0].children).map(
        (tr) => {
          return tr.textContent.replace(/\n|\s{2,}/g, "");
        }
      );
    });
    let shares = await page.evaluate(() => {
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
    await browser.close();
    return { header, shares };
  });
  return response;
}

async function performAction(action, data) {
  const browser = await puppeteer.launch({ headless: true });
  initiateGPWTrader(browser).then(async (page) => {
    await page.goto("https://gpwtrader.pl/quotes/shares");

    await page.evaluate(
      ({ action, data }) => {
        Array.from($("tbody > tr[data-isin] > td > span"))
          .filter((span) => span.innerText == data.companyName)
          .forEach((span) => $("a", span.parentNode).click());

        if (action == "buy") {
          $(".button.buy").click();
        } else if (action == "sell") {
          $(".button.sell").click();
        }
      },
      { action, data }
    );
    //wait for load of buy/sell form
    await page.waitForNavigation();

    await page.evaluate(
      ({ action, data }) => {
        let companyName = data.companyName.toUpperCase();
        let volume = data.volume.toUpperCase();
        let type = data.type.toUpperCase();
        let validity = data.validity.toUpperCase();
        $(`[id='isin'] > option:contains(${companyName})`).prop(
          "selected",
          true
        );
        $(`[id='wolumen']`).val(volume);
        $(`[id='type'] > option:contains(${type})`).prop("selected", true);
        $(`[id='validity'] > option:contains(${validity})`).prop(
          "selected",
          true
        );

        if (type === "LIMIT" || type === "STOP_LIMIT") {
          $(`[id='limit']`).val(data.limit);
        } else if (type === "STOP_LIMIT" || type === "STOP_lOSS") {
          $(`[id='activationLevel']`).val(data.activationLevel);
        }

        if (validity === "WDC" || validity === "WDD") {
          $(`[id='validityTime']`).val(data.validityTime);
        }

        $("[id='submit-exchange-order-form']").click();
      },
      { action, data }
    );

    //wait for load of confirm form
    await page.waitForNavigation();
  });

  runningBrowsers[data.token] = browser;
}

async function submitOrder(token) {
  const browser = runningBrowsers[token];
  //get page with confirm form
  const page = (await browser.pages())[0];
  await page.evaluate(() => {
    $(".button-zlecenie").click();
  });
  await page.waitForNavigation();
  let isSubmitted = await page.evaluate(() => {
    let response = $(".nazwa-instrumentu1").last()[0].innerText;
    if (response == "Złożone") {
      return true;
    }
    return false;
  });
}

function getStats() {}

exports.getCompanies = getCompanies;
exports.getBoughtShares = getBoughtShares;
