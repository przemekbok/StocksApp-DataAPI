const mongoose = require("mongoose");
const CredentialsModel = require("../models/GPWTCredentials");

const url = "mongodb://127.0.0.1:27017/gpwtrader";

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const db = mongoose.connection;

/**
 * This is foundation for package
 * Add, update and get functions needed
 */

export async function addCredentials(data) {
  let credentials = new CredentialsModel(data);
  credentials.save();
}

export async function getCredentials(userId) {
  let credentials = await CredentialsModel.find({ userId });
  return credentials;
}
