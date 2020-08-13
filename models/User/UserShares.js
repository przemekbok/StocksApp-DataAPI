const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSharesSchema = new Schema({
  userId: { type: String, unique: true },
  shares: [{ name: { type: String }, isin: { type: String }, params: Array }],
});

module.exports = mongoose.model("UserShares", userSharesSchema);
