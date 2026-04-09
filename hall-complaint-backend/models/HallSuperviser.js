const mongoose = require("mongoose");

const hallSupervisorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    hall: {
      type: String,
      required: true,
      trim: true,
    },

    por: {
      type: String,
      required: true,
      enum: ["hall_supervisor"],
      default: "hall_supervisor",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HallSupervisor", hallSupervisorSchema);