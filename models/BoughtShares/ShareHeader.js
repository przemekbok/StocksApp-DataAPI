const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sharesHeaderSchema = new Schema({
  name: { type: String, unique: true },
  fields: Array,
});

module.exports = mongoose.model("ShareHeader", sharesHeaderSchema);
