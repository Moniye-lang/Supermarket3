"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, X, ShieldAlert, ArrowRight, Loader2, Building, DollarSign } from "lucide-react";

interface TransferConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  pickupSlot?: string;
}

export default function TransferConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  amount,
  bankName,
  accountNumber,
  accountName,
  pickupSlot,
}: TransferConfirmModalProps) {
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, type: "acc" | "amount") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "acc") {
        setCopiedAcc(true);
        setTimeout(() => setCopiedAcc(false), 2000);
      } else {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 2000);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="transfer-confirm-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[115] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
      >
        <motion.div
          key="transfer-confirm-dialog"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl p-6 sm:p-8 max-w-md w-full relative z-10 overflow-hidden border border-gray-100 dark:border-zinc-800 text-left"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Cancel"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert size={26} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                Payment Confirmation
              </span>
              <h3 className="text-xl font-display font-extrabold text-gray-900 dark:text-white mt-0.5">
                Confirm Bank Transfer
              </h3>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
            In case you accidentally clicked the button, please verify you have made the transfer to our official store account below before confirming.
          </p>

          {/* Account Details Box */}
          <div className="bg-gray-50 dark:bg-zinc-800/80 rounded-2xl p-4 border border-gray-200/80 dark:border-zinc-700 space-y-3 mb-5">
            {/* Bank Name */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200/60 dark:border-zinc-700/60">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Bank Name</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Building size={14} className="text-gray-400" />
                {bankName || "AMStores Bank"}
              </span>
            </div>

            {/* Account Number (Copyable) */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200/60 dark:border-zinc-700/60">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-black font-mono tracking-wider text-gray-900 dark:text-white select-all">
                  {accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(accountNumber, "acc")}
                  className="p-1.5 rounded-lg bg-white dark:bg-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200 transition-colors border border-gray-200 dark:border-zinc-600 cursor-pointer shadow-xs flex items-center gap-1 text-[11px] font-bold"
                  title="Copy Account Number"
                >
                  {copiedAcc ? (
                    <>
                      <Check size={13} className="text-emerald-500" />
                      <span className="text-emerald-600 text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Account Name */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200/60 dark:border-zinc-700/60">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Account Name</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                {accountName || "AMStores Limited"}
              </span>
            </div>

            {/* Amount (Copyable) */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Exact Amount</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black font-display text-brand-primary select-all">
                  ₦{amount.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(String(amount), "amount")}
                  className="p-1.5 rounded-lg bg-white dark:bg-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200 transition-colors border border-gray-200 dark:border-zinc-600 cursor-pointer shadow-xs flex items-center gap-1 text-[11px] font-bold"
                  title="Copy Amount"
                >
                  {copiedAmount ? (
                    <>
                      <Check size={13} className="text-emerald-500" />
                      <span className="text-emerald-600 text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {pickupSlot && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mb-5">
              Pickup Slot: <strong className="text-gray-800 dark:text-gray-200">{pickupSlot}</strong>
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-3.5 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex-1"
            >
              Wait, Not Yet
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-600/25 flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Yes, I Have Transferred</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
