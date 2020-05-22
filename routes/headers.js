const express = require("express");
const router = express.Router();
const Database = require("../database/databaseManagement");

router.get("/", (req, res, next) => {
  let database = new Database();
  database.connectToDatabase();
  if (req.query.header) {
    if (req.query.header == "companies") {
      database.getHeader().then((response) => {
        res.status(200).type("application/json").send(JSON.stringify(response));
      });
    } else {
      res.status(404);
    }
  } else {
    res.status(404);
  }
});

module.exports = router;
