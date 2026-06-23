import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "14875bded9a025da665549e07f131b2e5ee0a06eda3efaafa813f9dd56ea1681970edeccdd10fc53b9b9ee8fe0e18d4a50eec";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 400 });
    if (user.isVerified) return NextResponse.json({ error: "User already verified" }, { status: 400 });

    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      token,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
