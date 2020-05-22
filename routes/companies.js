const express = require("express");
const router = express.Router();
const Database = require("../database/databaseManagement");

router.get("/", (req, res, next) => {
  let database = new Database();
  database.connectToDatabase();
  database.getCompanies(1, 10).then((response) => {
    res.status(200).type("application/json").send(JSON.stringify(response));
  });
});

module.exports = router;
