const express = require("express");
const router = express.Router();
const {
  Database,
  getCredentials,
  setCredentials,
} = require("../database/Database");
const { getUserIdFromToken, GPWTScrapper } = require("../logic/Scrapper");

router.post("/buy", (req, res, next) => {
  let token = req.header("Authorization");
  if (token === undefined) {
    let errorMessge = "Unauthorized!";
    res.status(403).send(JSON.stringify({ errorMessge }));
  } else {
    let formData = req.body;
    Database.tradeShares(formData, token, "BUY-SHARES").then((response) => {
      res.status(200).type("application/json").send(JSON.stringify(response));
    });
  }
});

router.post("/sell", (req, res, next) => {
  let token = req.header("Authorization");
  if (token === undefined) {
    let errorMessge = "Unauthorized!";
    res.status(403).send(JSON.stringify({ errorMessge }));
  } else {
    let formData = req.body;
    Database.tradeShares(formData, token, "SELL-SHARES").then((response) => {
      res.status(200).type("application/json").send(JSON.stringify(response));
    });
  }
});

module.exports = router;
