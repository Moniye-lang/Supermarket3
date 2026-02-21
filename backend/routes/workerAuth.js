// backend/routes/workerAuth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// 🟢 Worker Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already exists." });

    const passwordHash = await bcrypt.hash(password, 10);
    const worker = new User({
      name,
      email,
      passwordHash,
      phone,
      role: "rider", // worker role
    });

    await worker.save();

    const token = jwt.sign(
      { id: worker._id, role: worker.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Worker signup successful",
      user: { id: worker._id, name: worker.name, email: worker.email, role: worker.role },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during signup." });
  }
});

// 🟢 Worker Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    const worker = await User.findOne({ email, role: "rider" });
    if (!worker) return res.status(404).json({ error: "Worker not found." });

    const valid = await bcrypt.compare(password, worker.passwordHash);
    if (!valid) return res.status(400).json({ error: "Invalid credentials." });

    const token = jwt.sign(
      { id: worker._id, role: worker.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Worker login successful",
      user: { id: worker._id, name: worker.name, email: worker.email, role: worker.role },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login." });
  }
});

export default router;
