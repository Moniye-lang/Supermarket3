import webpush from "web-push";
import dbConnect from "@/lib/mongodb";
import PushSubscriptionModel from "@/lib/models/PushSubscription";

// ─── VAPID configuration ────────────────────────────────────────────────────

const vapidPublic  = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY  || "";
const vapidPrivate = process.env.WEB_PUSH_PRIVATE_KEY             || "";

if (!vapidPublic || !vapidPrivate) {
  console.warn("[Push] VAPID keys missing — push notifications will not work.");
} else {
  webpush.setVapidDetails(
    "mailto:davidadeniyi269@gmail.com",
    vapidPublic,
    vapidPrivate
  );
}

// ─── Subscription management (persisted to MongoDB) ──────────────────────────

export async function addSubscription(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userId: string | null = null
) {
  if (!subscription?.endpoint || !subscription?.keys) return;
  await dbConnect();
  await PushSubscriptionModel.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    { endpoint: subscription.endpoint, keys: subscription.keys, userId },
    { upsert: true, new: true }
  );
  if (userId) {
    console.log(`[Push] Saved subscription for userId: ${userId}`);
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url: string = "/"
) {
  await dbConnect();
  const subs = await PushSubscriptionModel.find({ userId }).lean();
  if (!subs || subs.length === 0) {
    console.log(`[Push] No subscription found for userId: ${userId}`);
    throw new Error(`No subscription found for userId: ${userId}`);
  }
  const payload = JSON.stringify({ title, body, url });
  let lastError: any = null;
  for (const sub of subs) {
    const pushSub = { endpoint: sub.endpoint, keys: sub.keys as any };
    try {
      await webpush.sendNotification(pushSub, payload);
      console.log(`[Push] Sent to userId: ${userId}`);
    } catch (e: any) {
      lastError = e;
      console.error(`[Push] Error sending to ${userId}:`, e.message);
      if (e.statusCode === 410 || e.statusCode === 404) {
        // Subscription expired — remove it
        await PushSubscriptionModel.deleteOne({ endpoint: sub.endpoint });
      }
    }
  }
  if (lastError) throw lastError;
}

export async function sendPushToAll(payload: { title: string; body: string; url?: string }) {
  await dbConnect();
  const subs = await PushSubscriptionModel.find({}).lean();
  const payloadStr = JSON.stringify(payload);
  console.log(`[Push] Broadcasting to ${subs.length} subscription(s)`);
  for (const sub of subs) {
    const pushSub = { endpoint: sub.endpoint, keys: sub.keys as any };
    try {
      await webpush.sendNotification(pushSub, payloadStr);
    } catch (e: any) {
      console.error("[Push] Broadcast error:", e.message);
      if (e.statusCode === 410 || e.statusCode === 404) {
        await PushSubscriptionModel.deleteOne({ endpoint: sub.endpoint });
      }
    }
  }
}

// ─── Debug helpers ────────────────────────────────────────────────────────────

export async function getSubscriptionCounts() {
  await dbConnect();
  const total  = await PushSubscriptionModel.countDocuments();
  const withUser = await PushSubscriptionModel.countDocuments({ userId: { $ne: null } });
  return { total, withUser, anonymous: total - withUser };
}
