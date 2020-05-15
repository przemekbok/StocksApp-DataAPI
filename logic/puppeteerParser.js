const puppeteer = require("puppeteer");
const $ = require("cheerio");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0"
  );
  await page.goto("https://gpwtrader.pl/");
  await page.click(".zaloguj");
  //await page.screenshot({ path: "elo2.png" });
  await page.evaluate(() => {
    document.querySelector("#login").value = "rzx83803@zzrgg.com";
    document.querySelector("#password").value = "Kapitanbomba1$";
    document.querySelector(".signin-btn").click();
  });
  await page.waitForNavigation();

  await page.goto("https://gpwtrader.pl/quotes/shares");

  let companies = await page.evaluate(() => {
    let headers = $(".universal-table > thead > tr")[0]
      .textContent.replace(/\s{2,}/g, "-")
      .split("-")
      .filter((word) => word);
    let data = $(".universal-table > tbody > tr")
      .toArray()
      .map((tr) => {
        let isin = tr.attributes["data-isin"].nodeValue;
        let obj = { isin };
        let params = tr.textContent
          .replace(/\s+/g, "-")
          .split("-")
          .filter((param) => param);
        for (let i = 0; i < params.length; i++) {
          obj[headers[i]] = params[i];
        }
        return obj;
      });
    return data;
  });
  console.log(companies[0]);

  let content = await page.content();
  await browser.close();
  return content;
})()
  .then((content) => {
    //console.log(content);
    // let stuff = $(".universal-table > tbody > tr", content);
    // for (let i = 0; i < 10; i++) {
    //   console.log($(stuff[i]).html());
    // }
    //let stuff = $(".universal-table > tbody > tr", content)[0].textContent;
    //console.log(stuff);
  })
  .catch((err) => console.log(err));
