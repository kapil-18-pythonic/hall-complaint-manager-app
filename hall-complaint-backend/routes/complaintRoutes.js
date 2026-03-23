const express = require("express");
const Complaint = require("../models/Complaint");

const router = express.Router();

const porAccessMap = {
  "gsec maintenance": ["civil", "electricity"],
  "gsec mess": ["mess"],
  "gsec sports": ["sports", "gym"],
};

const workerTypeMap = {
  civil: ["civil"],
  electricity: ["electricity"],
  mess: ["mess"],
  sports: ["sports"],
  gym: ["gym"],
};

const normalize = (value = "") => value.trim().toLowerCase();

// CREATE COMPLAINT
router.post("/", async (req, res) => {
  try {
    const complaint = await Complaint.create(req.body);

    return res.status(201).json({
      success: true,
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET ALL COMPLAINTS
router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      complaints,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// COUNCIL VIEW BY POR + HALL
router.get("/council/view", async (req, res) => {
  try {
    const { hall, por } = req.query;

    const allowedCategories = porAccessMap[normalize(por)] || [];

    const query = {
      category: { $in: allowedCategories },
    };

    if (hall) {
      query.hall = hall;
    }

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      complaints,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// WORKER VIEW BY TYPE + HALL
router.get("/worker/view", async (req, res) => {
  try {
    const { hall, type } = req.query;

    const allowedCategories = workerTypeMap[normalize(type)] || [];

    const query = {
      category: { $in: allowedCategories },
    };

    if (hall) {
      query.hall = hall;
    }

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      complaints,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET COMPLAINTS BY HALL
router.get("/hall/:hall", async (req, res) => {
  try {
    const complaints = await Complaint.find({
      hall: req.params.hall,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      complaints,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET SINGLE COMPLAINT BY ID
router.get("/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    return res.json({
      success: true,
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// COUNCIL ASSIGNS WORKER
router.patch("/:id/council-assign", async (req, res) => {
  try {
    const { workerName, workerId, workerType, councilName, councilPor } =
      req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const allowedCouncilCategories = porAccessMap[normalize(councilPor)] || [];
    const allowedWorkerCategories = workerTypeMap[normalize(workerType)] || [];

    if (!allowedCouncilCategories.includes(complaint.category)) {
      return res.status(403).json({
        success: false,
        message: "Council member cannot manage this complaint type.",
      });
    }

    if (!allowedWorkerCategories.includes(complaint.category)) {
      return res.status(400).json({
        success: false,
        message: "Worker type does not match complaint category.",
      });
    }

    if (complaint.assignedWorker) {
      return res.status(400).json({
        success: false,
        message: "Complaint is already assigned.",
      });
    }

    complaint.assignedWorker = workerName;
    complaint.assignedWorkerId = workerId;
    complaint.assignedByCouncil = true;
    complaint.assignedByCouncilName = councilName;
    complaint.assignedAt = new Date();
    complaint.workerStatus = "pending";
    complaint.status = "assigned";

    await complaint.save();

    return res.json({
      success: true,
      message: "Worker assigned successfully by council member.",
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// WORKER TAKES OVER COMPLAINT
router.patch("/:id/takeover", async (req, res) => {
  try {
    const { workerName, workerId, workerType } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (complaint.assignedWorker) {
      return res.status(400).json({
        success: false,
        message: "Complaint already assigned.",
      });
    }

    const allowedWorkerCategories = workerTypeMap[normalize(workerType)] || [];

    if (!allowedWorkerCategories.includes(complaint.category)) {
      return res.status(403).json({
        success: false,
        message: "Worker cannot take this complaint type.",
      });
    }

    complaint.assignedWorker = workerName;
    complaint.assignedWorkerId = workerId;
    complaint.assignedByCouncil = false;
    complaint.assignedByCouncilName = "";
    complaint.assignedAt = new Date();
    complaint.workerStatus = "accepted";
    complaint.status = "assigned";

    await complaint.save();

    return res.json({
      success: true,
      message: "Complaint taken over successfully.",
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// WORKER MARKS COMPLETED
router.patch("/:id/worker-complete", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.workerStatus = "completed";
    complaint.workerCompletedAt = new Date();
    complaint.status = "in_progress";

    await complaint.save();

    return res.json({
      success: true,
      message: "Worker marked complaint as completed.",
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// STUDENT CONFIRMS COMPLETION
router.patch("/:id/student-confirm", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.studentStatus = "completed";
    complaint.completedAt = new Date();
    complaint.status = "completed";

    await complaint.save();

    return res.json({
      success: true,
      message: "Complaint confirmed completed by student.",
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ESCALATE COMPLAINT
router.patch("/:id/escalate", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.escalated = true;
    complaint.escalatedAt = new Date();

    await complaint.save();

    return res.json({
      success: true,
      message: "Complaint escalated successfully.",
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// HIGHLIGHT BY WARDEN
router.patch("/:id/highlight", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (complaint.highlightedByWarden) {
      return res.status(400).json({
        success: false,
        message: "Complaint already highlighted.",
      });
    }

    complaint.highlightedByWarden = true;
    complaint.highlightedAt = new Date();

    await complaint.save();

    return res.json({
      success: true,
      message: "Complaint highlighted successfully.",
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE COMPLAINT
router.delete("/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    return res.json({
      success: true,
      message: "Complaint deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;