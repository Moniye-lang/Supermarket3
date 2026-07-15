"use client";
import { useEffect, useContext, useRef } from "react";
import { AuthContext } from "@/context/AuthContext";
import { registerServiceWorker, subscribeUser } from "@/lib/utils/pushManager";
import PushNotificationPrompt from "./PushNotificationPrompt";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";

export default function PushNotificationInit() {
  const { token, user } = useContext(AuthContext);
  const didSubscribe = useRef(false);

  useEffect(() => {
    // Only run once per session, only for authenticated users
    if (!token || !user || didSubscribe.current) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[Push] Push notifications not supported in this browser.");
      return;
    }

    async function initPush() {
      try {
        // Only auto-subscribe if permission is already granted.
        // Otherwise, the PushNotificationPrompt will guide/ask the user via a user gesture.
        if (Notification.permission === "granted") {
          let pubKey = "";
          try {
            const res = await fetch("/api/notifications/vapid");
            if (res.ok) {
              const data = await res.json();
              pubKey = data.publicKey;
            }
          } catch (e: any) {
            console.warn("[Push] Failed to fetch VAPID key dynamically, falling back to env:", e.message);
          }

          const activeKey = pubKey || VAPID_PUBLIC_KEY;
          if (!activeKey) {
            console.warn("[Push] VAPID public key is missing. Skipping subscription.");
            return;
          }

          const registration = await registerServiceWorker();
          await subscribeUser(registration, activeKey, token);
          didSubscribe.current = true;
          console.log("[Push] Successfully subscribed to push notifications.");
        }
      } catch (err) {
        console.error("[Push] Failed to initialize push notifications:", err);
      }
    }

    initPush();
  }, [token, user]);

  return <PushNotificationPrompt />;
}
