const express = require("express");
const cors = require("cors");

const { Resend } = require("resend");

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const nodemailer = require("nodemailer");
require("dotenv").config();

const connectDB = require("./config/db");

const students = require("./students");
const councilMembers = require("./councilMembers");
const workers = require("./workers");
const wardens = require("./wardens");

const complaintRoutes = require("./routes/complaintRoutes");
const workerRoutes = require("./routes/workerRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const resend = new Resend(process.env.RESEND_API_KEY);

const otpStore = {};

connectDB();

app.use(cors());
app.use(express.json());



const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function findUser(role, identifier) {
  const cleanIdentifier = identifier?.trim().toLowerCase();

  switch (role) {
    case "student":
      return students.find(
        (item) => item.roll?.trim().toLowerCase() === cleanIdentifier
      );

    case "council":
      return councilMembers.find(
        (item) => item.roll?.trim().toLowerCase() === cleanIdentifier
      );

    case "worker":
      return workers.find(
        (item) => item.email?.trim().toLowerCase() === cleanIdentifier
      );

    case "warden":
      return wardens.find(
        (item) => item.email?.trim().toLowerCase() === cleanIdentifier
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

    const user = findUser(role, identifier);

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
    const key = `${role}_${identifier.trim().toLowerCase()}`;

    otpStore[key] = {
      otp,
      user,
      role,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    let emailSent = false;
    let emailError = null;

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Hall Complaint Manager Login OTP",
        html: `
          <h2>Hall Complaint Manager</h2>
          <p>Hello ${user.name || "User"},</p>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>Valid for 5 minutes.</p>
        `,
      });

      if (error) {
        emailError = error.message;
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
      otp, // keep for testing (remove later)
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

app.post("/verify-otp", (req, res) => {
  try {
    const { role, identifier, otp } = req.body;

    if (!role || !identifier || !otp) {
      return res.status(400).json({
        success: false,
        message: "Role, identifier and OTP are required.",
      });
    }

    const key = `${role}_${identifier.trim().toLowerCase()}`;
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

    if (record.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    const user = record.user;
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

app.use("/api/complaints", complaintRoutes);
app.use("/api/workers", workerRoutes);

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
    message: "Internal server error",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});