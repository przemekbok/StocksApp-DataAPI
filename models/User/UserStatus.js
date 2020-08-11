const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userStatusSchema = new Schema({
  userId: { type: String, unique: true },
  resources: { type: String },
  wallet: { type: String },
  rate: { type: String },
});

module.exports = mongoose.model("UserStatus", userStatusSchema);
