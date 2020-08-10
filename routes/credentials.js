const express = require("express");
const router = express.Router();
const {
  Database,
  getCredentials,
  setCredentials,
} = require("../database/Database");
const { getUserIdFromToken, GPWTScrapper } = require("../logic/Scrapper");

router.get("/get", (req, res, next) => {
  let token = req.header("Authorization");
  let userId = token === undefined ? null : getUserIdFromToken(token);
  if (userId === null) {
    let errorMessage = "There is no credentials hooked up to user account";
    res
      .status(200)
      .type("application/json")
      .send(JSON.stringify({ errorMessage }));
  } else {
    getCredentials(userId)
      .then((response) => {
        res.status(200).type("application/json").send(JSON.stringify(response));
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

router.post("/set", (req, res, next) => {
  let token = req.header("Authorization");
  let userId = getUserIdFromToken(token);
  let { email, password } = req.body;
  let credentials = { userId, email, password };
  GPWTScrapper.testCredentials({ email, password }).then((result) => {
    if (result) {
      setCredentials(credentials)
        .then((response) => {
          res.status(200).type("application/json").send(response);
        })
        .catch((error) => {
          res.status(200).type("application/json").send(JSON.stringify(error));
        });
    } else {
      let errorMessage = "This credentails doesn't work for GPW Trader";
      res
        .status(200)
        .type("application/json")
        .send(JSON.stringify({ errorMessage }));
    }
  });
});

module.exports = router;
