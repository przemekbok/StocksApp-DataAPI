const express = require("express");
const router = express.Router();
const Database = require("../database/databaseManagement");

const database = new Database();

router.get("/", (req, res, next) => {
  database.connectToDatabase();
  if (req.query.page === undefined && req.query.size === undefined) {
    database.getCompanies().then((response) => {
      res.status(200).type("application/json").send(JSON.stringify(response));
    });
  } else {
    let page = req.query.page ? parseInt(req.query.page) : 0;
    let size = req.query.size ? parseInt(req.query.size) : 10;
    database.getCompaniesBatch(page, size).then((response) => {
      res.status(200).type("application/json").send(JSON.stringify(response));
    });
  }
});

router.get("/number", (req, res, next) => {
  database.connectToDatabase();
  database.getNumberOfCompanies().then((response) => {
    res.status(200).type("application/json").send(JSON.stringify(response));
  });
});

module.exports = router;
