//MONGOOSE
const mongoose = require("mongoose");
const { GPWTScrapper, getUserIdFromToken } = require("../logic/Scrapper");

//MODELS
const Company = require("../models/AllCompanies/Company");
const CompanyHeader = require("../models/AllCompanies/CompanyHeader");

//const Share = require("../models/BoughtShares/Share");
const ShareHeader = require("../models/BoughtShares/ShareHeader");
const UserShares = require("../models/User/UserShares");

const CredentialsModel = require("../models/User/UserGPWTCredentials");

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
    let response = await GPWTScrapper.performAction("GET-COMPANIES", token);
    let header = { name: "companies", fields: response.header };
    await saveCompanyHeader(header);
    response.companies.forEach(async (company) => {
      let data = Object.values(company)[0];
      let companyScheme = {
        name: data[0],
        isin: Object.keys(company)[0],
        params: data.slice(1),
      };
      await updateCompany(companyScheme);
    });
    return "List of companies has been updated!";
  }

  static async updateUserBoughtSharesCollection(token) {
    let response = await GPWTScrapper.performAction("GET-BOUGHT-SHARES", token);
    let fields = response.header.filter((label) => label != response.header[1]);
    let header = { name: "shares", fields };
    await this.saveBoughtSharesHeader(header);
    let userId = await getUserIdFromToken(token);
    let shares = [];
    response.shares.forEach((share) => {
      let data = Object.values(share)[0]; // {isin:data} model
      let shareScheme = {
        name: Object.keys(share)[0],
        params: data.slice(1), //cut down the name of company, data[0], from the rest of data
      };
      shares.push(shareScheme);
    });
    let userSharesScheme = { userId, shares };
    await this.saveUserBoughtShares(userSharesScheme);
    return "List of user's bought shares has been updated!";
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
      await this.updateUserBoughtSharesCollection(token).then((response) => {
        console.log(response); //looking for response - update performed
        //Bought shares are updated inside
      });
      return await UserShares.find({ userId })[0];
    } else {
      return userShares[0];
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

  static async saveBoughtSharesHeader(header) {
    const userSharesHeaderScheme = new ShareHeader(header);
    await userSharesHeaderScheme.save();
  }
  //----------------------
}

//Credentials
//----------------------
async function setCredentials(data) {
  let credentials = new CredentialsModel(data);
  await credentials.save();
}

async function getCredentials(userId) {
  let credentials = await CredentialsModel.find({ userId });
  let { email, password } = credentials[0];
  return { email, password };
}
//----------------------

module.exports = { Database, setCredentials, getCredentials };
