const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const students = require("./students");
const councilMembers = require("./councilMembers");
const workers = require("./workers");
const wardens = require("./wardens");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const otpStore = {};

app.get("/", (req, res) => {
  res.send("Backend is working");
});

app.get("/test", (req, res) => {
  res.json({ success: true, message: "Server is running fine" });
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function findUser(role, identifier) {
  switch (role) {
    case "student":
      return students.find(
        (item) => item.roll.toLowerCase() === identifier.trim().toLowerCase()
      );

    case "council":
      return councilMembers.find(
        (item) => item.roll.toLowerCase() === identifier.trim().toLowerCase()
      );

    case "worker":
      return workers.find(
        (item) => item.email.toLowerCase() === identifier.trim().toLowerCase()
      );

    case "warden":
      return wardens.find(
        (item) => item.email.toLowerCase() === identifier.trim().toLowerCase()
      );

    default:
      return null;
  }
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kapilchouhan1811@gmail.com",
    pass: "vmok uyfb bejp szuh",
  },
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

    const otp = generateOtp();
    const key = `${role}_${identifier.trim().toLowerCase()}`;

    otpStore[key] = {
      otp,
      user,
      role,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    await transporter.sendMail({
      from: "kapilchouhan1811@gmail.com",
      to: user.email,
      subject: "Hall Complaint Manager Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color:#1B2A72;">Hall Complaint Manager</h2>
          <p>Hello ${user.name},</p>
          <p>Your OTP for login is:</p>
          <h1 style="letter-spacing: 4px; color: #1B2A72;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
          <p>IIT Kharagpur</p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: "OTP sent successfully.",
      role,
      user,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP.",
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
        message: "No OTP found for this user.",
      });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[key];
      return res.status(400).json({
        success: false,
        message: "OTP expired.",
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    const user = record.user;
    delete otpStore[key];

    return res.json({
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
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port http://10.145.204.10:${PORT}`);
});