var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const puppeteer = require("puppeteer");

var cors = require("cors");

const Database = require("./database/databaseManagementNew");
const { GPWTScrapper } = require("./logic/GPWTraderScraperNew");

var indexRouter = require("./routes/index");
var companiesRouter = require("./routes/companies");
var headersRouter = require("./routes/headers");
var sharesRoute = require("./routes/boughtShares");
const credentialsRoute = require("./routes/credentials");

//SETUP
Database.connectToDatabase("mongodb://127.0.0.1:27017/gpwtrader");
puppeteer.launch({ headless: false }).then((browser) => {
  GPWTScrapper.setDefaultBrowser(browser);
});
//GLOBAL VARIABLES
/**TODO: Global object in Scraper, then set scrapper here
 * Also: Link moongoose here
 */

//----------------

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/companies", companiesRouter);
app.use("/headers", headersRouter);
app.use("/shares", sharesRoute);
app.use("/credentials", credentialsRoute);

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
  res.render("error");
});

module.exports = app;
