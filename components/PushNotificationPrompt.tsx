"use client";
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Bell, Share, PlusSquare, X, ArrowUpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { registerServiceWorker, subscribeUser } from "@/lib/utils/pushManager";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";

export default function PushNotificationPrompt() {
  const { token, user } = useContext(AuthContext);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !user) return;

    // Detect platform
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";
    const ios = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(ios);

    const standalone = typeof window !== "undefined" && (
      ("standalone" in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches
    );
    setIsStandalone(standalone);

    // Check permission status
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        // Show prompt if permission is not set yet
        const dismissed = localStorage.getItem("push_prompt_dismissed");
        if (!dismissed) {
          setShowPrompt(true);
        }
      }
    }
  }, [token, user]);

  const handleEnableNotifications = async () => {
    if (isIos && !isStandalone) {
      // iOS requires Add to Home Screen first to support Push Manager
      setShowPrompt(false);
      setShowIosGuide(true);
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const registration = await registerServiceWorker();
        await subscribeUser(registration, VAPID_PUBLIC_KEY, token);
        setShowPrompt(false);
      } else {
        console.warn("[Push] Permission denied or dismissed");
      }
    } catch (err) {
      console.error("[Push] Error during subscription flow:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("push_prompt_dismissed", "true");
  };

  if (!token || !user) return null;

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 z-50 flex flex-col gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                <Bell size={24} className="animate-bounce" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-base">Enable Order Notifications</h3>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Track your food and store pickups in real-time. We&apos;ll alert you when your rider is packing or arrives!
                </p>
              </div>
              <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-1 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleEnableNotifications}
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/95 transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Enable"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Add to Home Screen Guide Overlay */}
      <AnimatePresence>
        {showIosGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowIosGuide(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm relative z-10 border border-gray-100 flex flex-col items-center text-center"
            >
              <button
                onClick={() => setShowIosGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-905 bg-gray-100 rounded-full p-2"
              >
                <X size={16} />
              </button>

              <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center text-brand-primary mb-4">
                <ArrowUpCircle size={32} className="animate-pulse" />
              </div>

              <h3 className="font-extrabold text-gray-900 text-lg">Enable Notifications on iOS</h3>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                Apple requires this app to be added to your Home Screen before you can enable push notifications.
              </p>

              <div className="w-full bg-gray-50 rounded-2xl p-4 my-5 border border-gray-100 text-left space-y-3.5 text-xs text-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center border border-gray-200 font-bold shrink-0 text-brand-primary">1</div>
                  <p>Tap the <span className="font-bold inline-flex items-center gap-0.5 text-brand-primary">Share <Share size={12} className="inline" /></span> icon at the bottom of Safari.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center border border-gray-200 font-bold shrink-0 text-brand-primary">2</div>
                  <p>Scroll down and select <span className="font-bold inline-flex items-center gap-0.5 text-brand-primary">Add to Home Screen <PlusSquare size={12} className="inline" /></span>.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center border border-gray-200 font-bold shrink-0 text-brand-primary">3</div>
                  <p>Open the app from your home screen and enable notifications!</p>
                </div>
              </div>

              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-primary/20 text-sm"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
