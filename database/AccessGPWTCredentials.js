const mongoose = require("mongoose");
const CredentialsModel = require("../models/User/GPWTCredentials");

const url = "mongodb://127.0.0.1:27017/gpwtrader";

class GPWCredentials {
  constructor() {
    mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    const db = mongoose.connection;
    db.once("open", () => {
      console.log("Database connected:", url);
    });

    db.on("error", (err) => {
      console.error("connection error:", err);
    });
  }

  /**
   * This is foundation for package
   * Add, update and get functions needed
   */

  async setCredentials(data) {
    let credentials = new CredentialsModel(data);
    await credentials.save();
  }

  async getCredentials(userId) {
    let credentials = await CredentialsModel.find({ userId });
    let { email, password } = credentials[0];
    return { email, password };
  }
}

module.exports = GPWCredentials;
