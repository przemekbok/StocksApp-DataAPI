const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const credentialsSchema = new Schema({
  userId: { type: Number, unique: true },
  email: { type: String, unique: true },
  password: { type: String },
  params: Array,
});

module.exports = mongoose.model("Credentials", credentialsSchema);
