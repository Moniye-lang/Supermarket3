import { sendOtpEmail } from "./lib/email";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

console.log("Using env variables:");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);

console.log("Sending test OTP email to davidadeniyi269@gmail.com...");
const result = await sendOtpEmail("davidadeniyi269@gmail.com", "123456");
console.log("Result:", result);
