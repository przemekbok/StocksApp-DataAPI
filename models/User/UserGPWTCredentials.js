const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const credentialsSchema = new Schema({
  userId: { type: String, unique: true },
  email: { type: String },
  password: { type: String },
});

module.exports = mongoose.model("Credentials", credentialsSchema);
