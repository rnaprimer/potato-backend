// const mongoose = require("mongoose");

// const potatoSchema = new mongoose.Schema({
//   id: { type: String, unique: true },
//   pin: { type: String },
//   message: { type: String, default: "" }
// }, { timestamps: true });

// module.exports = mongoose.model("Potato", potatoSchema);

const mongoose = require("mongoose");

const potatoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  pinHash: { type: String, required: true },
  pinId: { type: String, required: true, index: true },
  message: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Potato", potatoSchema);