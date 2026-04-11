const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");

const Student = require("../models/Student");
const Worker = require("../models/Worker");
const CouncilMember = require("../models/CouncilMember");
const HallSupervisor = require("../models/HallSupervisor");

const router = express.Router();

// store uploaded file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function normalize(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalize(value).toLowerCase();
}

/* =====================================================
   MANAGER-ONLY MIDDLEWARE
===================================================== */
function checkManager(req, res, next) {
  const { requestedByPor } = req.body;

  if (requestedByPor !== "manager") {
    return res.status(403).json({
      success: false,
      message: "Only manager can manage members",
    });
  }

  next();
}

/* =====================================================
   GET MEMBERS
===================================================== */
router.get("/", async (req, res) => {
  try {
    const { role, hall } = req.query;

    if (!role || !hall) {
      return res.status(400).json({
        success: false,
        message: "role and hall are required",
      });
    }

    let data = [];

    if (role === "student") {
      data = await Student.find({ hall }).sort({ createdAt: -1 });
    } else if (role === "worker") {
      data = await Worker.find({ hall }).sort({ createdAt: -1 });
    } else if (role === "council") {
      data = await CouncilMember.find({ hall }).sort({ createdAt: -1 });
    } else if (role === "hallSupervisor") {
      data = await HallSupervisor.find({ hall }).sort({ createdAt: -1 });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch members",
    });
  }
});

/* =====================================================
   MANUAL ADD (MANAGER ONLY)
===================================================== */
router.post("/add", checkManager, async (req, res) => {
  try {
    const { roleType, name, roll, email, hall, por } = req.body;

    if (!roleType || !name || !hall) {
      return res.status(400).json({
        success: false,
        message: "roleType, name and hall required",
      });
    }

    let member;

    if (roleType === "student") {
      if (!roll || !email)
        return res.status(400).json({
          success: false,
          message: "Student requires roll and email",
        });

      const exists = await Student.findOne({
        $or: [{ roll }, { email }],
      });

      if (exists)
        return res.status(400).json({
          success: false,
          message: "Student already exists",
        });

      member = await Student.create({
        name: normalize(name),
        roll: normalize(roll),
        email: normalize(email),
        hall: normalize(hall),
      });
    }

    else if (roleType === "worker") {
      if (!email)
        return res.status(400).json({
          success: false,
          message: "Worker requires email",
        });

      const exists = await Worker.findOne({ email });

      if (exists)
        return res.status(400).json({
          success: false,
          message: "Worker already exists",
        });

      member = await Worker.create({
        name: normalize(name),
        email: normalize(email),
        hall: normalize(hall),
        type: "civil", // default type (can improve later)
      });
    }

    else if (roleType === "council") {
      if (!roll || !email || !por)
        return res.status(400).json({
          success: false,
          message: "Council requires roll, email, por",
        });

      const exists = await CouncilMember.findOne({
        $or: [{ roll }, { email }],
      });

      if (exists)
        return res.status(400).json({
          success: false,
          message: "Council member already exists",
        });

      member = await CouncilMember.create({
        name: normalize(name),
        roll: normalize(roll),
        email: normalize(email),
        hall: normalize(hall),
        por: normalizeLower(por),
      });
    }

    else if (roleType === "hallSupervisor") {
      if (!email || !por)
        return res.status(400).json({
          success: false,
          message: "Supervisor requires email and por",
        });

      if (!["manager", "hall_supervisor"].includes(por))
        return res.status(400).json({
          success: false,
          message: "Invalid supervisor por",
        });

      const exists = await HallSupervisor.findOne({ email });

      if (exists)
        return res.status(400).json({
          success: false,
          message: "Supervisor already exists",
        });

      member = await HallSupervisor.create({
        name: normalize(name),
        email: normalize(email),
        hall: normalize(hall),
        por: normalizeLower(por),
      });
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid roleType",
      });
    }

    return res.status(201).json({
      success: true,
      message: `${roleType} added successfully`,
      data: member,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add member",
    });
  }
});

/* =====================================================
   DELETE MEMBER (MANAGER ONLY)
===================================================== */
router.delete("/:role/:id", async (req, res) => {
  try {
    const { role, id } = req.params;
    const { requestedByPor } = req.query;

    if (requestedByPor !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only manager can delete members",
      });
    }

    let deleted = null;

    if (role === "student") {
      deleted = await Student.findByIdAndDelete(id);
    } else if (role === "worker") {
      deleted = await Worker.findByIdAndDelete(id);
    } else if (role === "council") {
      deleted = await CouncilMember.findByIdAndDelete(id);
    } else if (role === "hallSupervisor") {
      deleted = await HallSupervisor.findByIdAndDelete(id);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    return res.json({
      success: true,
      message: `${role} removed successfully`,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete member",
    });
  }
});

module.exports = router;