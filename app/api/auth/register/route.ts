import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, email, password, phone } = await req.json();
    const role = "customer"; // Strictly enforce customer role for public registration

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }

    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return NextResponse.json({ error: "Email already registered." }, { status: 400 });
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

    // Send OTP Email and await it
    await sendOtpEmail(email, otp).catch((err) => {
      console.error("❌ Error sending OTP email:", err.message);
    });

    const response: any = {
      success: true,
      message: "OTP sent to email. Please verify to complete registration.",
      email // Send back email for next step
    };

    if (process.env.NODE_ENV !== "production") {
      response.otp = otp;
    }

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
