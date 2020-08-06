const express = require("express");
const router = express.Router();
const Database = require("../database/databaseManagement");
const {
  getUserIdFromToken,
  GPWTScrapper,
} = require("../logic/GPWTraderScraperNew");
const GPWCredentials = require("../database/AccessGPWTCredentials");

const credentialsAccess = new GPWCredentials();
const scrapper = new GPWTScrapper();

router.get("/get", (req, res, next) => {
  let userId = getUserIdFromToken(req.header("Authorization"));
  credentialsAccess.getCredentials(userId).then((response) => {
    res.status(200).type("application/json").send(JSON.stringify(response));
  });
});

router.post("/set", (req, res, next) => {
  let userId = getUserIdFromToken(req.header("Authorization"));
  let { email, password } = req.body;
  let credentails = { userId, email, password };
  scrapper.testCredentials({ email, password }).then((result) => {
    if (result) {
      credentialsAccess
        .setCredentials(credentails)
        .then((response) => {
          res
            .status(200)
            .type("application/json")
            .send(JSON.stringify(response));
        })
        .catch((error) => {
          res.status(400).type("application/json").send(JSON.stringify(error));
        });
    } else {
    }
  });

  credentialsAccess.setCredentials(credentails).then((response) => {
    res.status(200).type("application/json").send(JSON.stringify(response));
  });
});

module.exports = router;
