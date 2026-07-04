import { NextResponse } from "next/server";
import { sendPushToUser, getSubscriptionCounts } from "@/lib/subscriptions";
import dbConnect from "@/lib/mongodb";
import PushSubscriptionModel from "@/lib/models/PushSubscription";

/**
 * GET /api/notifications/test?userId=<userId>
 * Sends a test notification directly to a userId.
 * Remove this route in production once notifications are confirmed working.
 */
export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const counts = await getSubscriptionCounts();

    if (!userId) {
      // Return list of all stored userIds for debugging
      const subs = await PushSubscriptionModel.find({}).select("userId endpoint createdAt").lean();
      return NextResponse.json({ counts, subscriptions: subs });
    }

    // Send a test push to the given userId
    await sendPushToUser(
      userId,
      "AMstores Test",
      "Push notifications are working correctly!",
      "/order"
    );

    return NextResponse.json({ success: true, message: `Test notification sent to userId: ${userId}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
