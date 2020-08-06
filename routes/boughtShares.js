const express = require("express");
const router = express.Router();
const Database = require("../database/databaseManagement");
const GPWTDatabase = require("../database/databaseManagementNew");

const database = new GPWTDatabase();

router.get("/", (req, res, next) => {
  database.getUserBoughtShares(req.query.token).then((response) => {
    res.status(200).type("application/json").send(JSON.stringify(response));
  });
});

module.exports = router;
