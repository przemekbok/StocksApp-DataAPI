const UserShares = require("../models/User/UserShares");

const mongoose = require("mongoose");
const url = "mongodb://127.0.0.1:27017/gpwtrader";
const GPWTraderScrapper = require("../logic/GPWTraderScraperNew").GPWTScrapper;
const getUserIdFromToken = require("../logic/GPWTraderScraperNew")
  .getUserIdFromToken;

const Company = require("../models/AllCompanies/Company");
const CompanyHeader = require("../models/AllCompanies/CompanyHeader");

const Share = require("../models/BoughtShares/Share");
const ShareHeader = require("../models/BoughtShares/ShareHeader");

class Database {
  #GPWTScrapper = new GPWTraderScrapper();
  constructor() {
    this.connectToDatabase();
  }
  connectToDatabase() {
    mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    const db = mongoose.connection;
    db.once("open", () => {
      console.log("Database connected:", url);
    });

    db.on("error", (err) => {
      console.error("connection error:", err);
    });
  }

  async updateCompaniesCollection(token) {
    return new Promise(async (resolve, reject) => {
      this.#GPWTScrapper
        .performAction("GET-COMPANIES", token)
        .then((response) => {
          let header = { name: "companies", fields: response.header };
          updateCompanyHeader(header).catch((err) => {
            reject(err);
          });
          response.companies.forEach((company) => {
            let data = Object.values(company)[0];
            let companyScheme = {
              name: data[0],
              isin: Object.keys(company)[0],
              params: data.slice(1),
            };
            updateCompany(companyScheme).catch((err) => {
              reject(err);
            });
          });
          resolve("Update has been performed");
        });
    });
  }

  async updateUserBoughtSharesCollection(token) {
    return new Promise(async (resolve, reject) => {
      this.#GPWTScrapper
        .performAction("GET-BOUGHT-SHARES", token)
        .then((response) => {
          let header = { name: "shares", fields: response.header };
          updateShareHeader(header).catch((err) => {
            reject(err);
          });
          let userId = getUserIdFromToken(token);
          let shares = [];
          response.shares.forEach((share) => {
            let data = Object.values(share)[0]; // {isin:data} model
            let shareScheme = {
              name: data[0],
              isin: Object.keys(share)[0],
              params: data.slice(1), //cut down the name of company, data[0], from the rest of data
            };
            shares.push(shareScheme);
          });
          let userSharesScheme = { userId, shares };
          this.saveUserBoughtShares(userSharesScheme).catch((err) => {
            reject(err);
          });
          resolve("Update has been performed");
        });
    });
  }

  //Companies
  //----------------------
  async getCompanies() {
    let companies = await Company.find();
    return companies;
  }

  async getCompaniesBatch(page, size) {
    let companies = await Company.find()
      .limit(size)
      .skip(page * size)
      .sort({ name: "asc" });
    return companies;
  }

  async saveCompany(company) {
    const c = new Company(company);
    await c.save();
  }

  //propably legacy
  async getNumberOfCompanies() {
    return await Company.countDocuments();
  }

  //Companies Header
  async getHeader() {
    return await CompanyHeader.find();
  }

  async saveCompanyHeader(header) {
    const c = new CompanyHeader(header);
    return c.save();
  }
  //----------------------

  //BoughtShares
  //----------------------
  async getUserBoughtShares(token) {
    let userId = getUserIdFromToken(token);
    let userShares = await UserShares.find({ userId });
    if (userShares.length === 0) {
      await this.updateUserBoughtSharesCollection(token).then((response) =>
        console.log(response)
      );
      return await UserShares.find({ userId });
    } else {
      return userShares;
    }
  }

  async saveUserBoughtShares(userShares) {
    const userSharesScheme = new UserShares(userShares);
    await userSharesScheme.save();
  }
  //Bought Shares Header
  async getUserBoughtSharesHeader() {
    return await ShareHeader.find();
  }

  async saveBoughtSharesHeader() {
    await CompanyHeader.findOneAndUpdate(
      { name: header.name },
      { fields: header.fields }
    );
  }
  //----------------------
}

module.exports = Database;
