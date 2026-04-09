const express = require("express");
const Complaint = require("../models/Complaint");

const router = express.Router();

const porAccessMap = {
  "gsec maintenance": ["other", "civil", "electricity"],
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

const supervisorAssignableCategories = ["civil", "electricity", "sports", "gym"];

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

    const sortedComplaints = complaints.sort((a, b) => {
      if (a.category === "other" && b.category !== "other") return -1;
      if (a.category !== "other" && b.category === "other") return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.json({
      success: true,
      complaints: sortedComplaints,
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

    if (!allowedCouncilCategories.includes(normalize(complaint.category))) {
      return res.status(403).json({
        success: false,
        message: "Council member cannot manage this complaint type.",
      });
    }

    if (!allowedWorkerCategories.includes(normalize(complaint.category))) {
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
    complaint.assignedByCouncilName = councilName || "Council Member";
    complaint.assignedBySupervisor = false;
    complaint.assignedBySupervisorName = "";
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

// HALL SUPERVISOR ASSIGNS WORKER
router.patch("/:id/supervisor-assign", async (req, res) => {
  try {
    const { workerName, workerId, workerType, supervisorName } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const complaintCategory = normalize(complaint.category);
    const allowedWorkerCategories = workerTypeMap[normalize(workerType)] || [];

    if (!supervisorAssignableCategories.includes(complaintCategory)) {
      return res.status(400).json({
        success: false,
        message:
          "Supervisor can assign workers only for civil, electricity, sports or gym complaints.",
      });
    }

    if (!allowedWorkerCategories.includes(complaintCategory)) {
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

    if (complaint.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed complaint cannot be assigned.",
      });
    }

    if (complaint.escalated) {
      return res.status(400).json({
        success: false,
        message: "Escalated complaint cannot be assigned from here.",
      });
    }

    complaint.assignedWorker = workerName;
    complaint.assignedWorkerId = workerId;
    complaint.assignedBySupervisor = true;
    complaint.assignedBySupervisorName = supervisorName || "Hall Supervisor";
    complaint.assignedByCouncil = false;
    complaint.assignedByCouncilName = "";
    complaint.assignedAt = new Date();
    complaint.workerStatus = "pending";
    complaint.status = "assigned";

    await complaint.save();

    return res.json({
      success: true,
      message: "Worker assigned successfully by hall supervisor.",
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// HALL SUPERVISOR RAISES QUERY TO STUDENT
router.patch("/:id/raise-query", async (req, res) => {
  try {
    const { queryText, raisedBy } = req.body;

    if (!queryText || !queryText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query text is required.",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.queryText = queryText.trim();
    complaint.latestQuery = queryText.trim();
    complaint.queryRaisedBy = raisedBy || "Hall Supervisor";
    complaint.queryRaisedAt = new Date();

    // clear previous reply if a fresh query is raised
    complaint.queryReply = "";
    complaint.studentQueryReply = "";
    complaint.queryRepliedAt = null;

    await complaint.save();

    return res.json({
      success: true,
      message: "Query raised successfully.",
      complaint,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// STUDENT REPLIES TO QUERY
router.patch("/:id/reply-query", async (req, res) => {
  try {
    const { replyText, repliedBy } = req.body;

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply text is required.",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.queryReply = replyText.trim();
    complaint.studentQueryReply = replyText.trim();
    complaint.queryRepliedBy = repliedBy || complaint.studentName || "Student";
    complaint.queryRepliedAt = new Date();

    await complaint.save();

    return res.json({
      success: true,
      message: "Reply submitted successfully.",
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

    if (!allowedWorkerCategories.includes(normalize(complaint.category))) {
      return res.status(403).json({
        success: false,
        message: "Worker cannot take this complaint type.",
      });
    }

    complaint.assignedWorker = workerName;
    complaint.assignedWorkerId = workerId;
    complaint.assignedByCouncil = false;
    complaint.assignedByCouncilName = "";
    complaint.assignedBySupervisor = false;
    complaint.assignedBySupervisorName = "";
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

// ESCALATE COMPLAINT TO WARDEN
router.patch("/:id/escalate", async (req, res) => {
  try {
    const { escalatedBy, escalatedByRole, reason } = req.body || {};

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.escalated = true;
    complaint.escalatedAt = new Date();
    complaint.escalatedBy = escalatedBy || "";
    complaint.escalatedByRole = escalatedByRole || "";
    complaint.escalationReason = reason || "";

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