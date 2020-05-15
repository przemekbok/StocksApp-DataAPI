const express = require("express");
const router = express.Router();
const companies = require("../logic/puppeteerParser");

router.get("/", (req, res, next) => {
  companies.getCompanies().then((response) => {
    res.status(200).type("application/json").send(JSON.stringify(response));
  });
});
