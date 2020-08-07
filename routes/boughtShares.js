const express = require("express");
const router = express.Router();
const { Database } = require("../database/Database");
const { userSharesToJSON } = require("../logic/MongoObjToJSON");

router.get("/", (req, res, next) => {
  let token = req.header("Authorization");
  Database.getUserBoughtShares(token).then((response) => {
    res.status(200).type("application/json").send(userSharesToJSON(response));
  });
});

module.exports = router;
