const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const shareSchema = new Schema({
  name: { type: String, unique: true },
  params: Array,
});

module.exports = mongoose.model("Share", shareSchema);
