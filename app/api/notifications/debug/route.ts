import { NextResponse } from "next/server";
import { getSubscriptionCounts } from "@/lib/subscriptions";

export async function GET() {
  try {
    const counts = await getSubscriptionCounts();
    const publicVapidKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";
    const privateVapidKey = process.env.WEB_PUSH_PRIVATE_KEY || "";

    return NextResponse.json({
      ...counts,
      vapidConfigured: {
        publicKeyPresent: !!publicVapidKey,
        publicKeyLength: publicVapidKey.length,
        privateKeyPresent: !!privateVapidKey,
        privateKeyLength: privateVapidKey.length,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
