const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSharesSchema = new Schema({
  userId: { type: String, unique: true },
  shares: [{ name: { type: String, unique: true }, fields: Array }],
});

module.exports = mongoose.model("UserShares", userSharesSchema);
