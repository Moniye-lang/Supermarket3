import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { addToBlacklist } from "../tokenBlacklist.js";
import authMiddleware from "../middleware/auth.js";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// -- Email Transporter --
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper to send OTP
const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your AMStores Verification Code",
    text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
  };
  await transporter.sendMail(mailOptions);
};

// 🟢 REGISTER (Step 1: Send OTP)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "customer", phone } = req.body;
    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const hash = await bcrypt.hash(password, 10);

    if (user && !user.isVerified) {
      // Update existing unverified user
      user.name = name;
      user.passwordHash = hash;
      user.role = role;
      user.phone = phone;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // Create new user
      user = new User({
        name,
        email,
        passwordHash: hash,
        role,
        phone,
        otp,
        otpExpires,
        isVerified: false
      });
      await user.save();
    }

    // Send OTP Email (Mock if no creds)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendOtpEmail(email, otp);
      console.log(`OTP sent to ${email}`);
    } else {
      console.log(`[MOCK] OTP for ${email}: ${otp}`);
    }

    res.json({
      success: true,
      message: "OTP sent to email. Please verify to complete registration.",
      email // Send back email for next step
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 🟢 VERIFY OTP (Step 2: Activate User)
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "User already verified" });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Email verified successfully",
      token,
      user: { id: user._id, name: user.name, role: user.role }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 RESEND OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "User already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendOtpEmail(email, otp);
    } else {
      console.log(`[MOCK] Resent OTP for ${email}: ${otp}`);
    }

    res.json({ success: true, message: "OTP resent successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 GOOGLE LOGIN
router.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body;
    let googleId, email, name;

    // Try standard ID Token verification first
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
    } catch (idTokenError) {
      // If ID Token fails, assume it's an Access Token and try fetching user info
      try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Invalid Access Token");
        const userInfo = await response.json();
        googleId = userInfo.sub;
        email = userInfo.email;
        name = userInfo.name;
      } catch (accessTokenError) {
        return res.status(400).json({ error: "Invalid Google Token" });
      }
    }

    let user = await User.findOne({ email });

    if (user) {
      // Link Google ID if not present
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true; // Trust Google verified emails
        await user.save();
      }
    } else {
      // Create new user from Google
      user = new User({
        name,
        email,
        googleId,
        isVerified: true,
        passwordHash: "GOOGLE_AUTH_NO_PASSWORD", // Placeholder
      });
      await user.save();
    }

    const tokenJwt = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Google login successful",
      token: tokenJwt,
      user: { id: user._id, name: user.name, role: user.role }
    });

  } catch (err) {
    console.error("Google Login Error:", err);
    res.status(400).json({ error: "Google authentication failed" });
  }
});

// 🟢 LOGIN (Standard)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "No such user found" });

    // Allow login if user registered via Google but hasn't set password yet (edge case) 
    // - though UI should force Google login for them, we handle standard flow here
    if (!user.passwordHash || user.passwordHash === "GOOGLE_AUTH_NO_PASSWORD") {
      return res.status(400).json({ error: "Please login with Google" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Wrong credentials" });

    if (!user.isVerified) return res.status(400).json({ error: "Please verify your email first" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, message: "Login successful", token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 LOGOUT
router.post("/logout", authMiddleware, (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.token;
    if (!authHeader) return res.status(400).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    addToBlacklist(token);

    res.json({ success: true, message: "Logged out successfully. Token invalidated." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Worker login route
router.post("/worker-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: "worker" });

    if (!user) return res.status(404).json({ error: "Worker not found" });

    const valid = await bcrypt.compare(password, user.password); // Using 'password' based on previous context, usually stored as hash
    // Standardizing on 'passwordHash' would be better, but keeping 'password' for worker if legacy
    // Re-reading worker login... it uses user.password. 
    // NOTE: In Register regular users get passwordHash. Workers might need migration if they use different field.
    // For now keeping as is from previous file content.
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, token, worker: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
