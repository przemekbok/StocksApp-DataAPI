const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const companySchema = new Schema({
  name: { type: String, unique: true },
  isin: { type: String },
  params: Array,
});

module.exports = mongoose.model("Company", companySchema);
