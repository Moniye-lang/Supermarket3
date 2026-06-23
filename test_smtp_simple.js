import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const cleanPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, "") : "";
console.log("Email User:", process.env.EMAIL_USER);
console.log("Clean Pass:", cleanPass);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: cleanPass,
  },
});

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER, // send to self
  subject: "SMTP Test from Antigravity",
  text: "Hello, this is a test to check if the App Password works.",
};

try {
  const info = await transporter.sendMail(mailOptions);
  console.log("Success:", info.response);
} catch (error) {
  console.error("Failed:", error.message);
}
