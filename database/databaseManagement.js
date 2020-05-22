const mongoose = require("mongoose");
const url = "mongodb://127.0.0.1:27017/companies";
const GPWTrader = require("../logic/GPWTraderScrapper");

const Company = require("../models/Company");
const Header = require("../models/Header");

class Database {
  connectToDatabase() {
    mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    //mongoose.set("useFindAndModify", true);

    const db = mongoose.connection;
    db.once("open", () => {
      console.log("Database connected:", url);
    });

    db.on("error", (err) => {
      console.error("connection error:", err);
    });
  }

  initiateDatabase() {
    GPWTrader.getCompanies().then((response) => {
      let header = { name: "companies", fields: response.header };
      saveHeader(header).catch((err) => {
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
    console.log("Update has been initiated");
  }

  async updateDatabase() {
    return new Promise(async (resolve, reject) => {
      //await Company.deleteMany({});
      //await Header.deleteMany({ name: "companies" });
      GPWTrader.getCompanies().then((response) => {
        let header = { name: "companies", fields: response.header };
        updateHeader(header).catch((err) => {
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

  async getCompanies(page, size) {
    let companies = await Company.find()
      .limit(size)
      .skip((page - 1) * size)
      .sort({ name: "asc" });
    return companies;
  }

  async getHeader() {
    return await Header.find();
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

async function saveHeader(header) {
  const c = new Header(header);
  return c.save();
}

async function updateHeader(header) {
  await Header.findOneAndUpdate(
    { name: header.name },
    { fields: header.fields }
  );
}

module.exports = Database;
