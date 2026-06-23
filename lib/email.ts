import nodemailer from "nodemailer";

let transporter: any = null;

const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ Email credentials missing. OTP emails will be mocked.");
      return null;
    }
    const cleanPass = process.env.EMAIL_PASS.replace(/\s+/g, "");
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: cleanPass,
      },
    });
  }
  return transporter;
};

export const sendOtpEmail = async (email: string, otp: string) => {
  // 1. Try Resend HTTP API (Recommended for Render free tier where SMTP ports are blocked)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AMStores <onboarding@resend.dev>",
          to: email,
          subject: "Your AMStores Verification Code",
          html: `Your verification code is: <strong>${otp}</strong>. It expires in 10 minutes.`,
        }),
      });

      const data = await response.json() as any;
      if (response.ok) {
        console.log(`✅ OTP sent to ${email} via Resend API`);
        return { success: true, mocked: false };
      } else {
        console.error("❌ Resend API failed:", data);
      }
    } catch (error: any) {
      console.error("❌ Resend HTTP request failed:", error.message);
    }
  }

  // 2. Try Gmail SMTP (Fallback)
  const mail = getTransporter();
  if (!mail) {
    console.log(`[MOCK] OTP for ${email}: ${otp}`);
    return { success: false, mocked: true, otp };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your AMStores Verification Code",
    text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
  };

  try {
    // Add connection timeout so it doesn't hang forever on blocked ports
    await Promise.race([
      mail.sendMail(mailOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP Connection Timeout")), 8000)),
    ]);
    console.log(`✅ OTP sent to ${email} via SMTP`);
    return { success: true, mocked: false };
  } catch (error: any) {
    console.error(`❌ Failed to send OTP to ${email}:`, error.message);
    console.log(`[MOCK FALLBACK] OTP for ${email}: ${otp}`);
    return { success: false, mocked: true, otp };
  }
};
