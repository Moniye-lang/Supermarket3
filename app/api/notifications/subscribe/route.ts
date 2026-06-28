import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { addSubscription } from "@/lib/subscriptions";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing");
}

export async function POST(req: Request) {
  try {
    const subscription = await req.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // Soft-verify token if available to map to userId
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization") || req.headers.get("token");
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded && decoded.id) {
          userId = decoded.id;
        }
      } catch (err: any) {
        console.warn("[Push] Soft token verification failed:", err.message);
      }
    }

    addSubscription(subscription, userId);
    return NextResponse.json({ message: "Subscribed successfully" }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
