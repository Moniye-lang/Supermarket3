import { NextResponse } from "next/server";
import { sendPushToAll, getSubscriptionCounts } from "@/lib/subscriptions";

export async function POST(req: Request) {
  try {
    const { title, body, url } = await req.json();
    await sendPushToAll({ title, body, url: url || "/" });
    const { total } = await getSubscriptionCounts();
    return NextResponse.json({ message: "Broadcast sent successfully", count: total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
