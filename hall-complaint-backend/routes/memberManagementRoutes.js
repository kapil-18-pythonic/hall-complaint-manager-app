const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");

const Student = require("../models/Student");
const Worker = require("../models/Worker");
const CouncilMember = require("../models/CouncilMember");

const router = express.Router();

// store uploaded file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

function normalize(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalize(value).toLowerCase();
}

// existing GET members
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
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET members error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch members",
    });
  }
});

// existing manual add
router.post("/", async (req, res) => {
  try {
    const { role, name, roll, email, hall, type, por } = req.body;

    if (!role || !name || !hall) {
      return res.status(400).json({
        success: false,
        message: "role, name and hall are required",
      });
    }

    let member;

    if (role === "student") {
      if (!roll || !email) {
        return res.status(400).json({
          success: false,
          message: "Student requires roll and email",
        });
      }

      member = await Student.create({
        name: normalize(name),
        roll: normalize(roll),
        email: normalize(email),
        hall: normalize(hall),
      });
    } else if (role === "worker") {
      if (!email || !type) {
        return res.status(400).json({
          success: false,
          message: "Worker requires email and type",
        });
      }

      member = await Worker.create({
        name: normalize(name),
        email: normalize(email),
        hall: normalize(hall),
        type: normalizeLower(type),
      });
    } else if (role === "council") {
      if (!roll || !email || !por) {
        return res.status(400).json({
          success: false,
          message: "Council member requires roll, email and por",
        });
      }

      member = await CouncilMember.create({
        name: normalize(name),
        roll: normalize(roll),
        email: normalize(email),
        hall: normalize(hall),
        por: normalizeLower(por),
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    return res.status(201).json({
      success: true,
      message: `${role} added successfully`,
      data: member,
    });
  } catch (error) {
    console.error("POST member error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add member",
    });
  }
});

// bulk upload route
router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  try {
    const { role, hall } = req.body;

    if (!role || !hall) {
      return res.status(400).json({
        success: false,
        message: "role and hall are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Uploaded file is empty",
      });
    }

    const inserted = [];
    const skipped = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // assuming row 1 is header
      const row = rows[i];

      try {
        if (role === "student") {
          const name = normalize(row.name);
          const roll = normalize(row.roll);
          const email = normalize(row.email);

          if (!name || !roll || !email) {
            skipped.push({
              row: rowNumber,
              reason: "name, roll, email required",
            });
            continue;
          }

          const exists = await Student.findOne({
            $or: [{ roll }, { email }],
          });

          if (exists) {
            skipped.push({
              row: rowNumber,
              reason: "student with same roll/email already exists",
            });
            continue;
          }

          const doc = await Student.create({
            name,
            roll,
            email,
            hall: normalize(hall),
          });

          inserted.push(doc);
        } else if (role === "worker") {
          const name = normalize(row.name);
          const email = normalize(row.email);
          const type = normalizeLower(row.type);

          if (!name || !email || !type) {
            skipped.push({
              row: rowNumber,
              reason: "name, email, type required",
            });
            continue;
          }

          const exists = await Worker.findOne({ email });

          if (exists) {
            skipped.push({
              row: rowNumber,
              reason: "worker with same email already exists",
            });
            continue;
          }

          const doc = await Worker.create({
            name,
            email,
            type,
            hall: normalize(hall),
          });

          inserted.push(doc);
        } else if (role === "council") {
          const name = normalize(row.name);
          const roll = normalize(row.roll);
          const email = normalize(row.email);
          const por = normalizeLower(row.por);

          if (!name || !roll || !email || !por) {
            skipped.push({
              row: rowNumber,
              reason: "name, roll, email, por required",
            });
            continue;
          }

          const exists = await CouncilMember.findOne({
            $or: [{ roll }, { email }],
          });

          if (exists) {
            skipped.push({
              row: rowNumber,
              reason: "council member with same roll/email already exists",
            });
            continue;
          }

          const doc = await CouncilMember.create({
            name,
            roll,
            email,
            por,
            hall: normalize(hall),
          });

          inserted.push(doc);
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid role",
          });
        }
      } catch (err) {
        skipped.push({
          row: rowNumber,
          reason: err.message || "insert failed",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk upload processed",
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Bulk upload failed",
      error: error.message,
    });
  }
});

// delete member
router.delete("/:role/:id", async (req, res) => {
  try {
    const { role, id } = req.params;

    let deleted = null;

    if (role === "student") {
      deleted = await Student.findByIdAndDelete(id);
    } else if (role === "worker") {
      deleted = await Worker.findByIdAndDelete(id);
    } else if (role === "council") {
      deleted = await CouncilMember.findByIdAndDelete(id);
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
    console.error("DELETE member error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete member",
    });
  }
});

module.exports = router;