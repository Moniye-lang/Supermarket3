import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "14875bded9a025da665549e07f131b2e5ee0a06eda3efaafa813f9dd56ea1681970edeccdd10fc53b9b9ee8fe0e18d4a50eec";

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
