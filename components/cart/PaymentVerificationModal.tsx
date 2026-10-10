"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";

interface VerificationOrder {
  id: string;
  code: string;
  amount: number;
  status: "verifying" | "accepted" | "declined";
}

interface PaymentVerificationModalProps {
  verificationOrder: VerificationOrder | null;
  countdown: number;
  onClose: () => void;
  onNavigateToOrder: () => void;
}

export default function PaymentVerificationModal({
  verificationOrder,
  countdown,
  onClose,
  onNavigateToOrder,
}: PaymentVerificationModalProps) {
  if (!verificationOrder) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 select-none bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", damping: 26, stiffness: 220 }}
          className="bg-white dark:bg-zinc-900 rounded-[2.2rem] shadow-2xl p-6 sm:p-8 max-w-md w-full text-center relative z-10 overflow-hidden border border-gray-100 dark:border-zinc-800"
        >
          {/* STATE 1: VERIFYING */}
          {verificationOrder.status === "verifying" && (
            <div className="space-y-5">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.45, 1.1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="absolute inset-0 bg-amber-400/25 rounded-full blur-xs"
                />
                <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-full flex items-center justify-center shadow-xl shadow-amber-500/25 relative z-10">
                  <Loader2 className="animate-spin text-white w-9 h-9" />
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Clock size={12} className="text-amber-600 animate-spin" /> Verifying Payment
                </span>
                <h2 className="text-2xl font-display font-extrabold text-gray-900 dark:text-white mt-1">
                  Waiting for Store Confirmation...
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                  Please hold on while our store attendant checks your transfer of{" "}
                  <strong className="text-gray-900 dark:text-white font-bold">
                    ₦{verificationOrder.amount.toLocaleString()}
                  </strong>
                  .
                </p>
              </div>

              <div className="bg-amber-50/70 dark:bg-zinc-800/80 border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest">
                  Order Reference Code
                </p>
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-widest font-mono my-1">
                  #{verificationOrder.code}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Station: <strong className="text-gray-800 dark:text-gray-200">AMStores Akobo Ibadan</strong>
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 py-2 px-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Store attendant notified · Live verification in progress</span>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={onNavigateToOrder}
                  className="w-full py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Track in Background on Orders Page</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: ACCEPTED */}
          {verificationOrder.status === "accepted" && (
            <div className="space-y-5">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
                <CheckCircle size={44} />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                  Payment Confirmed!
                </span>
                <h2 className="text-2xl font-display font-extrabold text-gray-900 dark:text-white mt-1">
                  Order Successfully Verified!
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                  Our store team has confirmed your transfer. Packing has started!
                </p>
              </div>

              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Redirecting to live order status in{" "}
                  <strong className="text-base font-black text-emerald-600">{countdown}s</strong>...
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToOrder}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Order Progress Now</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* STATE 3: DECLINED */}
          {verificationOrder.status === "declined" && (
            <div className="space-y-5">
              <div className="w-20 h-20 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-rose-500/25">
                <XCircle size={44} />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                  Payment Unconfirmed
                </span>
                <h2 className="text-2xl font-display font-extrabold text-gray-900 dark:text-white mt-1">
                  Transfer Alert Not Received
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                  Our attendants could not match this payment alert yet. Please ensure the exact total was sent with your name or order reference.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Close &amp; Check Bank
                </button>
                <button
                  type="button"
                  onClick={onNavigateToOrder}
                  className="flex-1 py-3 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover transition-colors cursor-pointer"
                >
                  View Orders
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
