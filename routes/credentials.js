const express = require("express");
const router = express.Router();
const Database = require("../database/databaseManagementNew");
const {
  getUserIdFromToken,
  GPWTScrapper,
} = require("../logic/GPWTraderScraperNew");

router.get("/get", (req, res, next) => {
  let userId = getUserIdFromToken(req.header("Authorization"));
  Database.getCredentials(userId).then((response) => {
    res.status(200).type("application/json").send(JSON.stringify(response));
  });
});

router.post("/set", (req, res, next) => {
  let userId = getUserIdFromToken(req.header("Authorization"));
  let { email, password } = req.body;
  let credentails = { userId, email, password };
  GPWTScrapper.testCredentials({ email, password }).then((result) => {
    if (result) {
      Database.setCredentials(credentails)
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

  Database.setCredentials(credentails).then((response) => {
    res.status(200).type("application/json").send(JSON.stringify(response));
  });
});

module.exports = router;
