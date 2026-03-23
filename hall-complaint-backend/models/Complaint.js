const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["civil", "electricity", "mess", "sports", "gym", "other"],
    },

    hall: {
      type: String,
      required: true,
      trim: true,
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },

    roomNo: {
      type: String,
      default: "",
      trim: true,
    },

    mobileNo: {
      type: String,
      default: "",
      trim: true,
    },

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

    assignedWorker: {
      type: String,
      default: "",
      trim: true,
    },

    assignedWorkerId: {
      type: String,
      default: "",
      trim: true,
    },

    assignedByCouncil: {
      type: Boolean,
      default: false,
    },

    assignedByCouncilName: {
      type: String,
      default: "",
      trim: true,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

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

    workerCompletedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    escalated: {
      type: Boolean,
      default: false,
    },

    escalatedAt: {
      type: Date,
      default: null,
    },

    highlightedByWarden: {
      type: Boolean,
      default: false,
    },

    highlightedAt: {
      type: Date,
      default: null,
    },

    photo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);