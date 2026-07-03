import { NextResponse } from "next/server";
import { getSubscriptionCounts } from "@/lib/subscriptions";

export async function GET() {
  try {
    const counts = await getSubscriptionCounts();
    return NextResponse.json(counts);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
