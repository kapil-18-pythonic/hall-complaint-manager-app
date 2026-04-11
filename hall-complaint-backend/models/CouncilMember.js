const mongoose = require("mongoose");

const councilMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    roll: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    hall: { type: String, required: true, trim: true },
    por: {
      type: String,
      required: true,
      enum: ["gsec_maintenance", "gsec_mess", "gsec_sports","gsec_welfare"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CouncilMember", councilMemberSchema);