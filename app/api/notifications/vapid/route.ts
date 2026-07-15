import { NextResponse } from "next/server";

export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";
  
  if (!vapidPublicKey) {
    console.warn("[Push API] NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY is not defined on the server.");
  }
  
  return NextResponse.json({ publicKey: vapidPublicKey });
}
