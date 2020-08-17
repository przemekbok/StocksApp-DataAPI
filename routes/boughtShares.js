const express = require("express");
const router = express.Router();
const { Database } = require("../database/Database");
const { userSharesToJSON } = require("../logic/MongoObjToJSON");

//test
router.get("/", (req, res, next) => {
  let token = req.header("Authorization");
  if (token === undefined) {
    let errorMessge = "Unauthorized!";
    res.status(403).send(JSON.stringify({ errorMessge }));
  } else {
    Database.getUserBoughtShares(token).then((response) => {
      res.status(200).type("application/json").send(userSharesToJSON(response));
    });
  }
});

module.exports = router;
