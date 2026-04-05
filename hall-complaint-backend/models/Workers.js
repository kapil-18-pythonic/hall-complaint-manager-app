const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    hall: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["civil", "electricity", "sports", "mess"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Worker", workerSchema);