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
    let sent = false;
    let sendError: string | null = null;

    try {
      await sendPushToUser(
        userId,
        "AMstores Test",
        "Push notifications are working correctly!",
        "/order"
      );
      sent = true;
    } catch (e: any) {
      sendError = e.message;
    }

    return NextResponse.json({
      success: sent,
      userId,
      message: sent
        ? `Notification dispatched to userId: ${userId}`
        : `Failed to send. Error: ${sendError || "No subscription found or send failed"}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
