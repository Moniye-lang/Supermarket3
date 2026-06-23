import { NextResponse } from "next/server";
import { globalSubscriptionsMap, userSubscriptionsMap } from "@/lib/subscriptions";

export async function GET() {
  try {
    return NextResponse.json({
      globalCount: globalSubscriptionsMap.size,
      userCount: userSubscriptionsMap.size,
      globalKeys: Array.from(globalSubscriptionsMap.keys()).map(k => k.substring(0, 30) + "..."),
      userKeys: Array.from(userSubscriptionsMap.keys())
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
