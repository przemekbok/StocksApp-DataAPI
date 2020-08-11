const express = require("express");
const router = express.Router();
const { Database } = require("../database/Database");

router.get("/", (req, res, next) => {
  let token = req.header("Authorization");
  if (token === undefined) {
    let errorMessge = "Unauthorized!";
    res.status(403).send(JSON.stringify({ errorMessge }));
  } else {
    Database.getUserStatus(token).then((response) => {
      res.status(200).type("application/json").send(JSON.stringify(response));
    });
  }
});

module.exports = router;
