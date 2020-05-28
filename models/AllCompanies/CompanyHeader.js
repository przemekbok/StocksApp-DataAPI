const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const companyHeaderSchema = new Schema({
  name: { type: String, unique: true },
  fields: Array,
});

module.exports = mongoose.model("CompanyHeader", companyHeaderSchema);
