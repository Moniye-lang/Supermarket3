import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { sendContactFormEmail } from "@/lib/email";

// Contact message schema
const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: "unread" },
  },
  { timestamps: true }
);

const ContactMessage = mongoose.models.ContactMessage || mongoose.model("ContactMessage", contactMessageSchema);

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Please fill out all fields before sending." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const created = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    // Send email notification to store admin
    const adminEmail = process.env.EMAIL_USER || "davidadeniyi269@gmail.com";
    sendContactFormEmail(adminEmail, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      createdAt: created.createdAt || new Date(),
    }).catch((emailErr: any) => {
      console.error("[Email] Contact form email dispatch error:", emailErr.message);
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your message has been sent successfully. Our support team will get back to you shortly.",
      id: created._id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send message" }, { status: 500 });
  }
}
