const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: String,
  role: String,
  userId: String,
});

module.exports = mongoose.model("Token", tokenSchema);