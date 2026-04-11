const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    category: {
      type: String,
      required: true,
      enum: ["civil", "electricity", "mess", "sports", "gym", "other"],
    },

    issueType: {
      type: String,
      enum: ["bullied", "medical", "other"],
      default: "other",
      trim: true,
    },

    hall: { type: String, required: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    roomNo: { type: String, default: "", trim: true },
    mobileNo: { type: String, default: "", trim: true },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "completed"],
      default: "pending",
    },

    assignedWorker: { type: String, default: "", trim: true },
    assignedWorkerId: { type: String, default: "", trim: true },
    assignedByCouncil: { type: Boolean, default: false },
    assignedByCouncilName: { type: String, default: "", trim: true },
    assignedBySupervisor: { type: Boolean, default: false },
    assignedBySupervisorName: { type: String, default: "", trim: true },
    assignedAt: { type: Date, default: null },

    workerStatus: {
      type: String,
      enum: ["pending", "accepted", "completed"],
      default: "pending",
    },

    studentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    workerCompletedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // 🔴 Highlight System
    studentHighlighted: { type: Boolean, default: false },
    studentHighlightedAt: { type: Date, default: null },

    councilHighlighted: { type: Boolean, default: false },
    councilHighlightedAt: { type: Date, default: null },

    forwardedToWarden: { type: Boolean, default: false },
    forwardedToWardenAt: { type: Date, default: null },
    forwardedByCouncil: { type: String, default: "", trim: true },
    forwardedByPor: { type: String, default: "", trim: true },

    // 🟥 WARDEN AUTHORITY SYSTEM
    wardenRemark: { type: String, default: "" },
    wardenRemarkAt: { type: Date, default: null },

    wardenEscalated: { type: Boolean, default: false },
    wardenEscalatedAt: { type: Date, default: null },

    photo: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);