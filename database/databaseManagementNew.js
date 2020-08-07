//MONGOOSE
const mongoose = require("mongoose");
const { GPWTScrapper } = require("../logic/GPWTraderScraperNew");
const getUserIdFromToken = require("../logic/GPWTraderScraperNew")
  .getUserIdFromToken;

//MODELS
const Company = require("../models/AllCompanies/Company");
const CompanyHeader = require("../models/AllCompanies/CompanyHeader");

//const Share = require("../models/BoughtShares/Share");
const ShareHeader = require("../models/BoughtShares/ShareHeader");
const UserShares = require("../models/User/UserShares");

const CredentialsModel = require("../models/User/GPWTCredentials");

class Database {
  static connectToDatabase(url) {
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

  static async updateCompaniesCollection(token) {
    return new Promise(async (resolve, reject) => {
      GPWTScrapper.performAction("GET-COMPANIES", token).then((response) => {
        let header = { name: "companies", fields: response.header };
        saveCompanyHeader(header).catch((err) => {
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

  static async updateUserBoughtSharesCollection(token) {
    return new Promise(async (resolve, reject) => {
      GPWTScrapper.performAction("GET-BOUGHT-SHARES", token).then(
        (response) => {
          console.log("\nResponse:", response, "\n");
          let header = { name: "shares", fields: response.header };
          this.saveBoughtSharesHeader(header).catch((err) => {
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
        }
      );
    });
  }

  //Companies
  //----------------------
  static async getCompanies() {
    let companies = await Company.find();
    return companies;
  }

  static async getCompaniesBatch(page, size) {
    let companies = await Company.find()
      .limit(size)
      .skip(page * size)
      .sort({ name: "asc" });
    return companies;
  }

  static async saveCompany(company) {
    const c = new Company(company);
    await c.save();
  }

  //propably legacy
  static async getNumberOfCompanies() {
    return await Company.countDocuments();
  }

  //Companies Header
  static async getCompanyHeader() {
    return await CompanyHeader.find();
  }

  static async saveCompanyHeader(header) {
    const c = new CompanyHeader(header);
    return c.save();
  }
  //----------------------

  //BoughtShares
  //----------------------
  static async getUserBoughtShares(token) {
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

  static async saveUserBoughtShares(userShares) {
    const userSharesScheme = new UserShares(userShares);
    await userSharesScheme.save();
  }
  //Bought Shares Header
  static async getUserBoughtSharesHeader() {
    return await ShareHeader.find();
  }

  static async saveBoughtSharesHeader() {
    await CompanyHeader.findOneAndUpdate(
      { name: header.name },
      { fields: header.fields }
    );
  }
  //----------------------

  Credentials;
  //----------------------
  static async setCredentials(data) {
    let credentials = new CredentialsModel(data);
    await credentials.save();
  }

  static async getCredentials(userId) {
    let credentials = await CredentialsModel.find({ userId });
    let { email, password } = credentials[0];
    return { email, password };
  }
  //----------------------
}

module.exports = Database;
