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
const UserStatus = require("../models/User/UserStatus");

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

  static async updateAllUserRelatedData(token) {
    let response = await GPWTScrapper.performAction("UPDATE-ALL", token);
    await this.saveUserStatus(response.status, token);
    await this.saveCompaniesCollection(response.companies);
    await this.saveUserBoughtSharesCollection(response.boughtShares, token);
  }

  static async updateAllCompanies(token) {
    let response = await GPWTScrapper.performAction("GET-COMPANIES", token);
    return await this.saveCompaniesCollection(response);
  }

  static async saveCompaniesCollection(collection) {
    let header = { name: "companies", fields: collection.header };
    await this.saveCompanyHeader(header);
    collection.companies.forEach(async (company) => {
      let data = Object.values(company)[0];
      let companyScheme = {
        name: data[0],
        isin: Object.keys(company)[0],
        params: data.slice(1),
      };
      await this.saveCompany(companyScheme);
    });
    return "List of companies has been updated!";
  }

  static async updateUserBoughtShares(token) {
    let response = await GPWTScrapper.performAction("GET-BOUGHT-SHARES", token);
    return await this.saveUserBoughtSharesCollection(response, token);
  }

  static async saveUserBoughtSharesCollection(collection, token) {
    // let fields = collection.header.filter(
    //   (label) => label != collection.header[1]
    // );
    let header = { name: "shares", fields: collection.header };
    await this.saveBoughtSharesHeader(header);
    let userId = await getUserIdFromToken(token);
    // let shares = [];
    // collection.shares.forEach((share) => {
    //   let data = Object.values(share)[0]; // {isin:data} model
    //   let shareScheme = {
    //     name: Object.keys(share)[0],
    //     params: data.slice(1), //cut down the name of company, data[0], from the rest of data
    //   };
    //   shares.push(shareScheme);
    // });
    let shares = collection.shares;
    let userSharesScheme = { userId, shares };
    await this.saveUserBoughtShares(userSharesScheme);
    return "List of user's bought shares has been updated!";
  }

  //User Status
  //----------------------
  static async getUserStatus(token) {
    let userId = await getUserIdFromToken(token);
    let userStatus = await UserStatus.findOne({ userId });
    //sanitizing object
    return {
      userId: userStatus.userId,
      resources: userStatus.resources,
      wallet: userStatus.wallet,
      rate: userStatus.rate,
    };
  }

  static async saveUserStatus(status, token) {
    let userId = await getUserIdFromToken(token);
    let userStatus = await UserStatus.findOne();
    if (userStatus !== null) {
      userStatus._doc = { ...userStatus._doc, ...status };
      await userStatus.save();
    } else {
      let newUserStatus = new UserStatus({ userId, ...status });
      await newUserStatus.save();
    }
  }
  //----------------------

  //Companies
  //----------------------
  static async getCompanies() {
    let companies = await Company.find();
    return companies;
  }

  static async saveCompany(company) {
    const c = await Company.findOne({ name: company.name, isin: company.isin });
    if (c !== null) {
      c.params = company.params;
      await c.save();
    } else {
      const newCompany = new Company(company);
      await newCompany.save((err) => {
        //TODO: weird duplicate error
      });
    }
  }

  static async getCompaniesBatch(page, size) {
    let companies = await Company.find()
      .limit(size)
      .skip(page * size)
      .sort({ name: "asc" });
    return companies;
  }

  //Companies Header
  static async getCompanyHeader() {
    let header = await CompanyHeader.findOne();
    return { name: header.name, fields: header.fields };
  }

  static async saveCompanyHeader(header) {
    const cHeaders = await CompanyHeader.findOne();
    if (cHeaders !== null) {
      cHeaders.fields = header.fields;
      await cHeaders.save();
    } else {
      const companyHeader = new CompanyHeader(header);
      await companyHeader.save();
    }
  }
  //----------------------

  //BoughtShares
  //----------------------
  static async getUserBoughtShares(token) {
    let userId = getUserIdFromToken(token);
    let userShares = await UserShares.find({ userId });
    if (userShares.length === 0) {
      return await UserShares.find({ userId })[0];
    } else {
      return userShares[0];
    }
  }

  static async saveUserBoughtShares(userShares) {
    const usersShares = await UserShares.findOne({ userId: userShares.userId });
    if (usersShares !== null) {
      usersShares.shares = userShares.shares;
      await usersShares.save();
    } else {
      const newUserShares = new UserShares(userShares);
      await newUserShares.save();
    }
  }
  //Bought Shares Header
  static async getUserBoughtSharesHeader() {
    let header = await ShareHeader.findOne();
    return { name: header.name, fields: header.fields };
  }

  static async saveBoughtSharesHeader(header) {
    const bsHeaders = await ShareHeader.findOne();
    if (bsHeaders !== null) {
      bsHeaders.fields = header.fields;
      await bsHeaders.save();
    } else {
      const userSharesHeader = new ShareHeader(header);
      await userSharesHeader.save();
    }
  }
  //----------------------

  //Buy/Sell Shares
  //----------------------
  static async tradeShares(formData, token, type) {
    let result = await GPWTScrapper.performAction(type, token, formData);
    return result;
  }
  //----------------------
}

//Credentials
//----------------------
async function setCredentials(data) {
  let credentials = await CredentialsModel.findOne({ userId: data.userId });
  if (credentials !== null) {
    const { email, password } = data;
    credentials._doc = { ...credentials._doc, email, password };
    await credentials.save();
  } else {
    let newCredentials = new CredentialsModel(data);
    await newCredentials.save();
  }
  return true;
}

async function getCredentials(userId) {
  let credentials = await CredentialsModel.findOne({ userId });
  credentials =
    credentials !== null ? credentials : { email: "", password: "" };
  return { email: credentials.email, password: credentials.password };
}
//----------------------

module.exports = { Database, setCredentials, getCredentials };
