const https = require("https");
const zlib = require("zlib");

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
