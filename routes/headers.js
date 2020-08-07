const express = require("express");
const router = express.Router();
const { Database } = require("../database/Database");

router.get("/", (req, res, next) => {
  if (req.query.header) {
    if (req.query.header === "companies") {
      Database.getCompanyHeader().then((response) => {
        res.status(200).type("application/json").send(JSON.stringify(response));
      });
    } else if (req.query.header === "shares") {
      Database.getUserBoughtSharesHeader().then((response) => {
        res.status(200).type("application/json").send(JSON.stringify(response));
      });
    } else {
      res.status(404);
    }
  } else {
    res.status(404);
  }
});

module.exports = router;
