const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();

const connectDB = require("./config/db");

// Old fallback files
const students = require("./students");
const councilMembers = require("./councilMembers");
const workers = require("./workers");
const wardens = require("./wardens");
const hallSupervisers = require("./hallSupervisor");

// MongoDB models
const Student = require("./models/Student");
const Worker = require("./models/Worker");
const CouncilMember = require("./models/CouncilMember");
const HallSuperviser = require("./models/HallSupervisor");

// Routes
const complaintRoutes = require("./routes/complaintRoutes");
const workerRoutes = require("./routes/workerRoutes");
const memberManagementRoutes = require("./routes/memberManagementRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const resend = new Resend(process.env.RESEND_API_KEY);

const otpStore = {};

connectDB();

app.use(cors());
app.use(express.json());

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeIdentifier(value = "") {
  return value.trim().toLowerCase();
}

// DB-first, static fallback
async function findUser(role, identifier) {
  const cleanIdentifier = normalizeIdentifier(identifier);

  if (!cleanIdentifier) return null;

  let dbUser = null;

  switch (role) {
    case "student":
      dbUser = await Student.findOne({
        roll: {
          $regex: `^${escapeRegex(cleanIdentifier)}$`,
          $options: "i",
        },
      }).lean();

      if (dbUser) return dbUser;

      return students.find(
        (item) => normalizeIdentifier(item.roll) === cleanIdentifier
      );

    case "council":
      dbUser = await CouncilMember.findOne({
        roll: {
          $regex: `^${escapeRegex(cleanIdentifier)}$`,
          $options: "i",
        },
      }).lean();

      if (dbUser) return dbUser;

      return councilMembers.find(
        (item) => normalizeIdentifier(item.roll) === cleanIdentifier
      );

    case "worker":
      dbUser = await Worker.findOne({
        email: {
          $regex: `^${escapeRegex(cleanIdentifier)}$`,
          $options: "i",
        },
      }).lean();

      if (dbUser) return dbUser;

      return workers.find(
        (item) => normalizeIdentifier(item.email) === cleanIdentifier
      );

    case "warden":
      return wardens.find(
        (item) => normalizeIdentifier(item.email) === cleanIdentifier
      );

    case "hallSupervisor":
      dbUser = await HallSuperviser.findOne({
        email: {
          $regex: `^${escapeRegex(cleanIdentifier)}$`,
          $options: "i",
        },
      }).lean();

      if (dbUser) return dbUser;

      return hallSupervisers.find(
        (item) => normalizeIdentifier(item.email) === cleanIdentifier
      );

    default:
      return null;
  }
}

app.get("/", (req, res) => {
  res.send("Backend is working ✅");
});

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Server is running fine",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server healthy",
  });
});

app.post("/send-otp", async (req, res) => {
  try {
    const { role, identifier } = req.body;

    if (!role || !identifier) {
      return res.status(400).json({
        success: false,
        message: "Role and identifier are required.",
      });
    }

    const allowedRoles = [
      "student",
      "council",
      "worker",
      "warden",
      "hallSupervisor",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    const user = await findUser(role, identifier);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${role} not found.`,
      });
    }

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: "User email not found.",
      });
    }

    const otp = generateOtp();
    const key = `${role}_${normalizeIdentifier(identifier)}`;

    otpStore[key] = {
      otp,
      user,
      role,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    let emailSent = false;
    let emailError = null;

    try {
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Hall Complaint Manager Login OTP",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Hall Complaint Manager</h2>
            <p>Hello ${user.name || "User"},</p>
            <p>Your OTP for login is:</p>
            <h1 style="letter-spacing: 4px;">${otp}</h1>
            <p>This OTP is valid for 5 minutes.</p>
          </div>
        `,
      });

      if (error) {
        emailError = error.message || "Failed to send email.";
      } else {
        emailSent = true;
      }
    } catch (err) {
      emailError = err.message;
      console.error("Resend error:", err);
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? "OTP sent successfully."
        : "OTP generated but email failed.",
      role,
      user,
      otp, // keep only while testing
      emailSent,
      emailError,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate OTP.",
      error: error.message,
    });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const { role, identifier, otp } = req.body;

    if (!role || !identifier || !otp) {
      return res.status(400).json({
        success: false,
        message: "Role, identifier and OTP are required.",
      });
    }

    const key = `${role}_${normalizeIdentifier(identifier)}`;
    const record = otpStore[key];

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "No OTP found. Please request a new OTP.",
      });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[key];
      return res.status(400).json({
        success: false,
        message: "OTP expired.",
      });
    }

    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // optional fresh re-check
    const freshUser = await findUser(role, identifier);
    const user = freshUser || record.user;

    delete otpStore[key];

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      role,
      user,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "OTP verification failed.",
      error: error.message,
    });
  }
});

// Routes
app.use("/api/complaints", complaintRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/members", memberManagementRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});