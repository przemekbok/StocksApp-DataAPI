const puppeteer = require("puppeteer");

async function getCompanies() {
  const browser = await puppeteer.launch({ headless: true });
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
}

exports.getCompanies = getCompanies;
