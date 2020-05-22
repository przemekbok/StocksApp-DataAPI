const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const headerSchema = new Schema({
  name: { type: String, unique: true },
  fields: Array,
});

module.exports = mongoose.model("Header", headerSchema);
