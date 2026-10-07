const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGO_URI = process.env.MONGO_URI;
console.log("URI present:", !!MONGO_URI);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["customer", "worker", "rider", "admin"], default: "customer" },
    isAvailable: { type: Boolean, default: true },
    status: { type: String, enum: ["available", "busy", "offline", "break"], default: "available" },
    phone: { type: String, trim: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function main() {
  try {
    console.log("Attempting Mongoose connect with Google DNS...");
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
    });
    console.log("Connected successfully!");

    const email = "pickup@amstores.com";
    const plainPassword = "pickupisready123";
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log(`Found existing user with email ${email}. Updating...`);
      existing.name = "Pickup Worker";
      existing.passwordHash = passwordHash;
      existing.role = "worker";
      existing.isVerified = true;
      existing.isAvailable = true;
      existing.status = "available";
      await existing.save();
      console.log("✅ Worker updated successfully:", JSON.stringify({
        id: existing._id,
        name: existing.name,
        email: existing.email,
        role: existing.role,
        isVerified: existing.isVerified,
        status: existing.status
      }, null, 2));
    } else {
      console.log(`Creating new user with email ${email}...`);
      const newWorker = new User({
        name: "Pickup Worker",
        email: email.toLowerCase(),
        passwordHash,
        role: "worker",
        isVerified: true,
        isAvailable: true,
        status: "available",
        phone: "+2348000000000",
      });
      await newWorker.save();
      console.log("✅ Worker created successfully:", JSON.stringify({
        id: newWorker._id,
        name: newWorker.name,
        email: newWorker.email,
        role: newWorker.role,
        isVerified: newWorker.isVerified,
        status: newWorker.status
      }, null, 2));
    }

    await mongoose.disconnect();
    console.log("Done!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
