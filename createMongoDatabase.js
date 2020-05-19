const mongoose = require("mongoose");
const url = "mongodb://127.0.0.1:27017/companies";
const GPWTrader = require("./logic/puppeteerParser");

const Company = require("./models/Company");

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.once("open", () => {
  console.log("Database connected:", url);
  updateDatabase();
});

db.on("error", (err) => {
  console.error("connection error:", err);
});

async function saveCompany(company) {
  await Company.deleteMany();
  const c = new Company(company);
  return c.save();
}

function updateDatabase() {
  GPWTrader.getCompanies().then((response) => {
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
