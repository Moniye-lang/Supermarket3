import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { addSubscription } from "@/lib/subscriptions";

const JWT_SECRET = process.env.JWT_SECRET || "14875bded9a025da665549e07f131b2e5ee0a06eda3efaafa813f9dd56ea1681970edeccdd10fc53b9b9ee8fe0e18d4a50eec";

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
