const express = require("express");
const router = express.Router();
const GPWTDatabase = require("../database/databaseManagementNew");

router.get("/", (req, res, next) => {
  let token = req.header("Authorization");
  GPWTDatabase.getUserBoughtShares(token).then((response) => {
    res.status(200).type("application/json").send(JSON.stringify(response));
  });
});

module.exports = router;
