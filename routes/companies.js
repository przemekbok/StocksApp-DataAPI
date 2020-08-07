const express = require("express");
const router = express.Router();
const { Database } = require("../database/Database");

router.get("/", (req, res, next) => {
  if (req.query.page === undefined && req.query.size === undefined) {
    Database.getCompanies().then((response) => {
      res.status(200).type("application/json").send(JSON.stringify(response));
    });
  } else {
    let page = req.query.page ? parseInt(req.query.page) : 0;
    let size = req.query.size ? parseInt(req.query.size) : 10;
    Database.getCompaniesBatch(page, size).then((response) => {
      res.status(200).type("application/json").send(JSON.stringify(response));
    });
  }
});

router.get("/number", (req, res, next) => {
  Database.getNumberOfCompanies().then((response) => {
    res.status(200).type("application/json").send(JSON.stringify(response));
  });
});

module.exports = router;
