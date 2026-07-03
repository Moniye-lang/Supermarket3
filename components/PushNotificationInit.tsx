"use client";
import { useEffect, useContext, useRef } from "react";
import { AuthContext } from "@/context/AuthContext";
import { registerServiceWorker, subscribeUser } from "@/lib/utils/pushManager";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";

/**
 * Mounts invisibly inside Providers.
 * On login (token + user present), registers the service worker and
 * subscribes the user to push notifications — once per session.
 */
export default function PushNotificationInit() {
  const { token, user } = useContext(AuthContext);
  const didSubscribe = useRef(false);

  useEffect(() => {
    // Only run once per session, only for authenticated users
    if (!token || !user || didSubscribe.current) return;
    if (!VAPID_PUBLIC_KEY) {
      console.warn("[Push] NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY is not set.");
      return;
    }
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[Push] Push notifications not supported in this browser.");
      return;
    }

    async function initPush() {
      try {
        // Request notification permission if not already granted
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("[Push] Notification permission denied.");
          return;
        }

        const registration = await registerServiceWorker();
        await subscribeUser(registration, VAPID_PUBLIC_KEY, token);
        didSubscribe.current = true;
        console.log("[Push] Successfully subscribed to push notifications.");
      } catch (err) {
        console.error("[Push] Failed to initialize push notifications:", err);
      }
    }

    initPush();
  }, [token, user]);

  return null;
}
