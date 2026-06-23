import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 400 });
    if (user.isVerified) return NextResponse.json({ error: "User already verified" }, { status: 400 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP Email and await it
    await sendOtpEmail(email, otp).catch((err) => {
      console.error("❌ Error sending OTP email:", err.message);
    });

    const response: any = {
      success: true,
      message: "OTP resent successfully"
    };

    if (process.env.NODE_ENV !== "production") {
      response.otp = otp;
    }

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
