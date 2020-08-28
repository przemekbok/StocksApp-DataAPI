const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const puppeteer = require("puppeteer");

const cors = require("cors");

const { Database } = require("./database/Database");
const { GPWTScrapper } = require("./logic/Scrapper");

const companiesRouter = require("./routes/companies");
const headersRouter = require("./routes/headers");
const sharesRoute = require("./routes/boughtShares");
const credentialsRoute = require("./routes/credentials");
const updateRoute = require("./routes/update");
const userStatusRoute = require("./routes/status");
const tradeRoute = require("./routes/trade");
const dotenv = require("dotenv");

dotenv.config({ path: `${__dirname}/.env` });
//if no configured address then try to use local db
const ADDRESS = process.env.ADDRESS
  ? process.env.ADDRESS
  : "127.0.0.1:27017/gpwtrader";
//SETUP
if (process.env.LOGIN && process.env.PASSWORD) {
  Database.connectToDatabase(
    `mongodb${process.env.ADDRESS ? "+srv" : ""}://${process.env.LOGIN}:${
      process.env.PASSWORD
    }@${ADDRESS}`
  );
} else {
  Database.connectToDatabase(`mongodb://${ADDRESS}`);
}

puppeteer
  .launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  .then((browser) => {
    GPWTScrapper.setDefaultBrowser(browser);
  });

var app = express();

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/companies", companiesRouter);
app.use("/headers", headersRouter);
app.use("/shares", sharesRoute);
app.use("/credentials", credentialsRoute);
app.use("/update", updateRoute);
app.use("/status", userStatusRoute);
app.use("/trade", tradeRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: err,
  });
});

module.exports = app;
