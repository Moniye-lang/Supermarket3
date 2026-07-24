import { sendOtpEmail } from "./lib/email";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

console.log("Using env variables:");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);

const testEmail = process.env.EMAIL_USER;
if (!testEmail) throw new Error("EMAIL_USER is not set in .env.local");
console.log(`Sending test OTP email to ${testEmail}...`);
const result = await sendOtpEmail(testEmail, "123456");
console.log("Result:", result);
