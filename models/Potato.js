const mongoose = require("mongoose");

const potatoSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  pin: { type: String },
  message: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Potato", potatoSchema);