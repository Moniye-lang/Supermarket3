import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing");
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await User.findOne({ email, role: { $in: ["worker", "rider"] } });

    if (!user) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

    // Handle standard passwordHash (or fallback to password if any old field used it)
    const passToCompare = user.passwordHash || user.password;
    if (!passToCompare) {
      return NextResponse.json({ error: "Invalid worker credentials format" }, { status: 400 });
    }

    const valid = await bcrypt.compare(password, passToCompare);
    if (!valid) return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return NextResponse.json({
      success: true,
      message: "Worker login successful",
      token,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
