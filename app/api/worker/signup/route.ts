import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { verifyAdmin } from "@/lib/authMiddleware";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing");
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    // Verify Admin
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required!" }, { status: 403 });
    }

    const { name, email, password, phone } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already exists." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const worker = new User({
      name,
      email,
      passwordHash,
      phone,
      role: "rider", // Default worker role
    });

    await worker.save();

    const token = jwt.sign(
      { id: worker._id, role: worker.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      message: "Worker signup successful",
      user: { id: worker._id, name: worker.name, email: worker.email, role: worker.role },
      token,
    });
  } catch (err: any) {
    console.error("Worker signup error:", err);
    return NextResponse.json({ error: "Server error during signup." }, { status: 500 });
  }
}
