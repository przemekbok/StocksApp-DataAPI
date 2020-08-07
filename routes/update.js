const express = require("express");
const router = express.Router();
const { Database } = require("../database/Database");

router.get("/", (req, res, next) => {
  let token = req.header("Authorization");
  Database.updateUserBoughtSharesCollection(token).then((response) => {
    console.log(response);
    res.status(200).type("application/json").send();
  });
});

module.exports = router;
