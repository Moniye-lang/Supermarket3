import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email } = await req.json();
    console.log(`[Forgot Password] Request for email: ${email}`);

    if (!email) {
      console.error("[Forgot Password] Missing email in request body");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    console.log(`[Forgot Password] User found: ${!!user}`);

    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 400 });
    }

    if (user.googleId && !user.passwordHash) {
      return NextResponse.json({ error: "This account uses Google authentication. Please login with Google." }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    console.log(`[Forgot Password] Generated OTP for user ${user._id}`);
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    console.log(`[Forgot Password] User saved successfully`);

    // Send OTP Email and await it
    await sendOtpEmail(email, otp).catch((err) => {
      console.error("❌ Error sending OTP email:", err.message);
    });

    const response: any = {
      success: true,
      message: "Password reset OTP sent to your email",
      email
    };

    if (process.env.NODE_ENV !== "production") {
      response.otp = otp;
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[Forgot Password] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
