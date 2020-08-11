const express = require("express");
const router = express.Router();
const { Database, getCredentials } = require("../database/Database");
const { getUserIdFromToken } = require("../logic/Scrapper");

router.get("/", (req, res, next) => {
  let token = req.header("Authorization");
  let userId = token === undefined ? null : getUserIdFromToken(token);
  if (userId == null) {
    res.status(200).type("application/json").send();
  } else {
    getCredentials(userId).then((credentials) => {
      if (credentials.email === "") {
        let errorMessage = "Authentication failed";
        res
          .status(403)
          .type("application/json")
          .send(JSON.stringify(errorMessage));
      } else {
        Database.updateAllUserRelatedData(token).then(() => {
          res.status(200).type("application/json").send();
        });
      }
    });
  }
});

module.exports = router;
