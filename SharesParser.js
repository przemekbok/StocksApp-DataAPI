const https = require("https");
const zlib = require("zlib");

const getSessionOptions = {
  headers: {
    Host: "gpwtrader.pl",
    "User-Agent":
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0",
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    Connection: "close",
  },
  host: "gpwtrader.pl",
  port: 443,
  method: "GET",
  path: `/`,
};

const postLogInOptions = {
  headers: {
    Host: "gpwtrader.pl",
    "User-Agent":
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0",
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    Connection: "close",
  },
  host: "gpwtrader.pl",
  port: 443,
  method: "POST",
  path: `/user/signin`,
};

const request = https.request(getSessionOptions, (response) => {
  let cookie = response.headers["set-cookie"];
  logIn(cookie, "rzx83803@zzrgg.com", "Kapitanbomba1$").then((res) => {
    console.log(res);
  });
  request.on("error", (err) => {
    console.log(err);
  });
});
request.end();

function logIn(cookie, username, password) {
  let data = encodeURI(
    `username=${username}&password=${password}&remember-me=false`
  );
  postLogInOptions["cookie"] = cookie;
  return new Promise((resolve) => {
    const request = https.request(postLogInOptions, (response) => {
      response.on("data", (d) => {
        console.log(d.toString());
      });
      resolve(response.headers);
    });
    request.write(data);
    request.end();
  });
}
