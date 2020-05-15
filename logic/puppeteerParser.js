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
    return $(".universal-table > thead > tr")[0]
      .textContent.replace(/\s{2,}/g, "-")
      .split("-")
      .filter((word) => word);
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
