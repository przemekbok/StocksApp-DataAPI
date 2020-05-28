const express = require("express");
const router = express.Router();
const Database = require("../database/databaseManagement");

const database = new Database();

router.get("/", (req, res, next) => {
  database.connectToDatabase();
  database.getBoughtShares().then((response) => {
    res.status(200).type("application/json").send(JSON.stringify(response));
  });
});

module.exports = router;
