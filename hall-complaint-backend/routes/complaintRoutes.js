const express = require("express");
const Complaint = require("../models/Complaint");

const router = express.Router();

/*=======================================
    CLOUDINARY
==========================================*/

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hall-complaints",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

/* =====================================================
   CONFIG
===================================================== */

const porAccessMap = {
  "gsec maintenance": ["civil", "electricity"],
  "gsec mess": ["mess"],
  "gsec sports": ["sports", "gym"],
  "gsec welfare": ["other"],
};

const workerTypeMap = {
  civil: ["civil"],
  electricity: ["electricity"],
  mess: ["mess"],
  sports: ["sports"],
  gym: ["gym"],
};

const supervisorAssignableCategories = [
  "civil",
  "electricity",
  "sports",
  "gym",
];

const normalize = (value = "") => value.trim().toLowerCase();

/* =====================================================
   CREATE COMPLAINT (✅ FIXED WITH CLOUDINARY)
===================================================== */
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    let photoUrl = "";

    if (req.file) {
      photoUrl = req.file.path; // Cloudinary URL
    }

    const complaintData = {
      ...req.body,
      photo: photoUrl,
    };

    const complaint = await Complaint.create(complaintData);

    return res.status(201).json({ success: true, complaint });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =====================================================
   GET ALL COMPLAINTS
===================================================== */
router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    return res.json({ success: true, complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =====================================================
   GET SINGLE COMPLAINT
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint)
      return res.status(404).json({ success: false, message: "Not found" });

    return res.json({ success: true, complaint });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =====================================================
   COUNCIL VIEW
===================================================== */
router.get("/council/view", async (req, res) => {
  try {
    const { hall, por } = req.query;
    const normalizedPor = normalize(por);

    let query = {};
    if (hall) query.hall = hall;

    if (normalizedPor === "gsec welfare") {
      query.category = "other";
      query.issueType = { $in: ["medical", "bullied"] };
    } else {
      const allowedCategories = porAccessMap[normalizedPor] || [];
      query.category = { $in: allowedCategories };
    }

    const complaints = await Complaint.find(query).sort({
      createdAt: -1,
    });

    return res.json({ success: true, complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =====================================================
   WORKER VIEW
===================================================== */
router.get("/worker/view", async (req, res) => {
  try {
    const { workerId } = req.query;

    if (!workerId)
      return res.status(400).json({
        success: false,
        message: "Worker ID required",
      });

    const complaints = await Complaint.find({
      assignedWorkerId: workerId,
    }).sort({ createdAt: -1 });

    return res.json({ success: true, complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =====================================================
   GET BY HALL
===================================================== */
router.get("/hall/:hall", async (req, res) => {
  try {
    const complaints = await Complaint.find({
      hall: req.params.hall,
    }).sort({ createdAt: -1 });

    return res.json({ success: true, complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =====================================================
   SUPERVISOR ASSIGN WORKER
===================================================== */
router.patch("/:id/supervisor-assign", async (req, res) => {
  try {
    const { workerName, workerId, workerType, supervisorName } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint)
      return res.status(404).json({ success: false, message: "Not found" });

    const category = normalize(complaint.category);
    const allowedWorkerCategories =
      workerTypeMap[normalize(workerType)] || [];

    if (!supervisorAssignableCategories.includes(category))
      return res.status(400).json({
        success: false,
        message: "Supervisor cannot assign this type",
      });

    if (!allowedWorkerCategories.includes(category))
      return res.status(400).json({
        success: false,
        message: "Worker type mismatch",
      });

    if (complaint.assignedWorker)
      return res.status(400).json({
        success: false,
        message: "Already assigned",
      });

    complaint.assignedWorker = workerName;
    complaint.assignedWorkerId = workerId;
    complaint.assignedBySupervisor = true;
    complaint.assignedBySupervisorName =
      supervisorName || "Supervisor";
    complaint.assignedAt = new Date();
    complaint.status = "assigned";

    await complaint.save();

    return res.json({ success: true, complaint });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =====================================================
   WORKER COMPLETE
===================================================== */
router.patch("/:id/worker-complete", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint)
      return res.status(404).json({ success: false, message: "Not found" });

    complaint.workerStatus = "completed";
    complaint.workerCompletedAt = new Date();
    complaint.status = "in_progress";

    await complaint.save();

    return res.json({ success: true, complaint });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =====================================================
   STUDENT CONFIRM
===================================================== */
router.patch("/:id/student-confirm", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint)
      return res.status(404).json({ success: false, message: "Not found" });

    complaint.studentStatus = "completed";
    complaint.completedAt = new Date();
    complaint.status = "completed";

    await complaint.save();

    return res.json({ success: true, complaint });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =====================================================
   WARDEN STATS (FIXED - SINGLE ROUTE)
===================================================== */
router.get("/warden-stats/:hall", async (req, res) => {
  try {
    const complaints = await Complaint.find({
      hall: req.params.hall,
      forwardedToWarden: true,
    });

    const total = complaints.length;
    const completed = complaints.filter(
      (c) => c.status === "completed"
    ).length;

    const conflict = complaints.filter(
      (c) =>
        c.workerStatus === "completed" &&
        c.studentStatus === "pending"
    ).length;

    const highlighted = complaints.filter(
      (c) =>
        c.studentHighlighted ||
        c.councilHighlighted ||
        c.wardenEscalated
    ).length;

    const urgent = complaints.filter(
      (c) => c.priority === "urgent"
    ).length;

    const pending = total - completed - conflict;

    return res.json({
      success: true,
      stats: {
        total,
        pending,
        completed,
        conflict,
        highlighted,
        urgent,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;