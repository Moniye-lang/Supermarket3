import webpush from "web-push";

// Configure VAPID keys
const vapidPublic = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || process.env.VITE_WEB_PUSH_PUBLIC_KEY;
const vapidPrivate = process.env.WEB_PUSH_PRIVATE_KEY || process.env.VITE_WEB_PUSH_PRIVATE_KEY;

if (!vapidPublic || !vapidPrivate) {
  console.warn("[Push] VAPID public or private key is missing. Push notifications will not be configured.");
} else {
  webpush.setVapidDetails(
    "mailto:example@yourdomain.com",
    vapidPublic,
    vapidPrivate
  );
}

// Prevent re-initialization of maps on hot reload
if (!(global as any).globalSubscriptionsMap) {
  (global as any).globalSubscriptionsMap = new Map();
}
if (!(global as any).userSubscriptionsMap) {
  (global as any).userSubscriptionsMap = new Map();
}

export const globalSubscriptionsMap: Map<string, any> = (global as any).globalSubscriptionsMap;
export const userSubscriptionsMap: Map<string, any> = (global as any).userSubscriptionsMap;

export function addSubscription(subscription: any, userId: string | null = null) {
  if (!subscription || !subscription.endpoint) return;
  
  globalSubscriptionsMap.set(subscription.endpoint, subscription);
  
  if (userId) {
    userSubscriptionsMap.set(userId, subscription);
    console.log(`[Push] Mapped subscription to userId: ${userId}`);
  }
}

export async function sendPushToUser(userId: string, title: string, body: string, url: string = "/") {
  const sub = userSubscriptionsMap.get(userId);
  if (!sub) {
    console.log(`[Push] No active subscription found for userId: ${userId}`);
    return;
  }
  const payload = JSON.stringify({ title, body, url });
  try {
    await webpush.sendNotification(sub, payload);
    console.log(`[Push] Sent notification to userId: ${userId}`);
  } catch (e: any) {
    console.error(`[Push] Send error for user ${userId}:`, e.message);
    if (e.statusCode === 410 || e.statusCode === 404) {
      userSubscriptionsMap.delete(userId);
      globalSubscriptionsMap.delete(sub.endpoint);
    }
  }
}

export async function sendPushToAll(payload: any) {
  const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
  const promises: Promise<any>[] = [];
  
  console.log(`[Push] Broadcasting notification to ${globalSubscriptionsMap.size} device(s)`);
  
  for (const [endpoint, sub] of globalSubscriptionsMap.entries()) {
    promises.push(
      webpush.sendNotification(sub, payloadStr).catch((e: any) => {
        console.error(`[Push] Broadcast send error:`, e.message);
        if (e.statusCode === 410 || e.statusCode === 404) {
          globalSubscriptionsMap.delete(endpoint);
          // Clean up from user map too
          for (const [userId, userSub] of userSubscriptionsMap.entries()) {
            if (userSub.endpoint === endpoint) {
              userSubscriptionsMap.delete(userId);
            }
          }
        }
      })
    );
  }
  await Promise.all(promises);
}
