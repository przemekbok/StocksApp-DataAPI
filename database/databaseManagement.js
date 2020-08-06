const mongoose = require("mongoose");
const url = "mongodb://127.0.0.1:27017/gpwtrader";
const GPWTrader = require("../logic/GPWTraderScrapper");
const GPWTraderScrapper = require("../logic/GPWTraderScraperNew");

const Company = require("../models/AllCompanies/Company");
const CompanyHeader = require("../models/AllCompanies/CompanyHeader");

const Share = require("../models/BoughtShares/Share");
const ShareHeader = require("../models/BoughtShares/ShareHeader");

/**
 * class that packs all actions that are needed to operate GWPTrader data
 */
class Database {
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

  //collection init for companies
  initiateCompanyCollection() {
    GPWTrader.getCompanies().then((response) => {
      let header = { name: "companies", fields: response.header };
      saveCompanyHeader(header).catch((err) => {
        console.log(err);
      });
      response.companies.forEach((company) => {
        let data = Object.values(company)[0];
        let companyScheme = {
          name: data[0],
          isin: Object.keys(company)[0],
          params: data.slice(1),
        };
        saveCompany(companyScheme).catch((err) => {
          console.log(err);
        });
      });
    });
  }

  initiateCompanyCollectionNew() {
    GPWTraderScrapper.scrapCompanies().then((response) => {
      let header = { name: "companies", fields: response.header };
      saveCompanyHeader(header).catch((err) => {
        console.log(err);
      });
      response.companies.forEach((company) => {
        let data = Object.values(company)[0];
        let companyScheme = {
          name: data[0],
          isin: Object.keys(company)[0],
          params: data.slice(1),
        };
        saveCompany(companyScheme).catch((err) => {
          console.log(err);
        });
      });
    });
  }

  //collection init for bouht shares
  initiateBoughtSharesCollection() {
    GPWTrader.getBoughtShares().then((response) => {
      let header = { name: "shares", fields: response.header };
      saveShareHeader(header).catch((err) => {
        console.log(err);
      });
      response.shares.forEach((share) => {
        let data = Object.values(share)[0];
        let shareSheme = {
          name: Object.keys(share)[0],
          params: data,
        };
        saveShare(shareSheme).catch((err) => {
          console.log(err);
        });
      });
    });
  }

  async updateCompanyCollection() {
    return new Promise(async (resolve, reject) => {
      GPWTrader.getCompanies().then((response) => {
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

  async updateShareCollection() {
    return new Promise(async (resolve, reject) => {
      GPWTrader.getBoughtShares().then((response) => {
        let header = { name: "shares", fields: response.header };
        updateShareHeader(header).catch((err) => {
          reject(err);
        });
        response.companies.forEach((company) => {
          let data = Object.values(company)[0];
          let shareScheme = {
            name: data[0],
            isin: Object.keys(company)[0],
            params: data.slice(1),
          };
          updateShare(shareScheme).catch((err) => {
            reject(err);
          });
        });
        resolve("Update has been performed");
      });
    });
  }

  async getCompaniesBatch(page, size) {
    let companies = await Company.find()
      .limit(size)
      .skip(page * size)
      .sort({ name: "asc" });
    return companies;
  }

  async getCompanies() {
    let companies = await Company.find();
    return companies;
  }

  async getHeader() {
    return await CompanyHeader.find();
  }

  async getNumberOfCompanies() {
    return await Company.countDocuments();
  }

  async getBoughtShares() {
    return await Share.find();
  }

  async getSharesHeader() {
    return await ShareHeader.find();
  }
}

async function saveCompany(company) {
  const c = new Company(company);
  return c.save();
}

async function updateCompany(company) {
  await Company.findOneAndUpdate(
    { name: company.name },
    { params: company.params }
  );
}

async function saveCompanyHeader(header) {
  const c = new CompanyHeader(header);
  return c.save();
}

async function updateCompanyHeader(header) {
  await CompanyHeader.findOneAndUpdate(
    { name: header.name },
    { fields: header.fields }
  );
}

async function saveShare(share) {
  const c = new Share(share);
  return c.save();
}

async function updateShare(share) {
  await Share.findOneAndUpdate({ name: share.name }, { params: share.params });
}

async function saveShareHeader(header) {
  const c = new ShareHeader(header);
  return c.save();
}

async function updateShareHeader(header) {
  await ShareHeader.findOneAndUpdate(
    { name: header.name },
    { fields: header.fields }
  );
}

module.exports = Database;
