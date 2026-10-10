"use client";

import React from "react";
import { User, Phone, Clock, CreditCard, Copy, Check, AlertCircle, ShoppingBag } from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  [key: string]: any;
}

interface CheckoutFormProps {
  cart: CartItem[];
  customerName: string;
  setCustomerName: (val: string) => void;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  todaySlots: { label: string }[];
  pickupSlot: string;
  setPickupSlot: (val: string) => void;
  closedMessage: string;
  storeSettings: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    paymentInstructions: string;
  };
  copied: boolean;
  copyAccount: () => void;
  copiedPrice: boolean;
  copyPrice: () => void;
  totalPrice: number;
  error: string;
  onModifyBasket: () => void;
}

export default function CheckoutForm({
  cart,
  customerName,
  setCustomerName,
  phoneNumber,
  setPhoneNumber,
  todaySlots,
  pickupSlot,
  setPickupSlot,
  closedMessage,
  storeSettings,
  copied,
  copyAccount,
  copiedPrice,
  copyPrice,
  totalPrice,
  error,
  onModifyBasket,
}: CheckoutFormProps) {
  return (
    <div className="space-y-6">

      {/* ── Order Preview Mini-Bar ── */}
      <div className="bg-gray-50 dark:bg-zinc-800/60 rounded-2xl p-4 border border-gray-200/80 dark:border-zinc-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Order Review ({cart.length} items)
          </span>
          <button
            type="button"
            onClick={onModifyBasket}
            className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
          >
            Modify Basket
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-48 overflow-y-auto pr-1">
          {cart.map((item) => {
            const itemId = String(item.productId || item._id || item.id || "");
            const unitPrice = Number(item.price) || 0;
            const lineTotal = unitPrice * (Number(item.qty) || 1);

            return (
              <div key={itemId || item.name} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {item.qty} × ₦{unitPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-brand-primary shrink-0">
                  ₦{lineTotal.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Customer Details ── */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <User size={13} /> Pickup Customer Details
        </h3>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-brand-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Phone Number (For verification &amp; pickup call)
          </label>
          <input
            type="tel"
            placeholder="e.g. 08012345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* ── Pickup Time Slot ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={13} /> Select Pickup Slot
          </h3>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50">
            Store Open 24/7
          </span>
        </div>
        {todaySlots.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {todaySlots.map((slot) => (
              <button
                key={slot.label}
                type="button"
                onClick={() => setPickupSlot(slot.label)}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                  pickupSlot === slot.label
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-xs"
                    : "bg-gray-50 dark:bg-zinc-800/60 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200">
            {closedMessage}
          </p>
        )}
      </div>

      {/* ── Bank Transfer Details Box ── */}
      <div className="bg-gray-50/80 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard size={14} className="text-brand-primary" /> Store Bank Account
          </h4>
          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
            Instant Verification
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-700 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Bank Name:</span>
            <strong className="text-gray-900 dark:text-white font-bold">{storeSettings.bankName}</strong>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Account Name:</span>
            <strong className="text-gray-900 dark:text-white font-bold">{storeSettings.accountName}</strong>
          </div>
          <div className="flex justify-between items-center text-xs pt-1.5 border-t border-gray-100 dark:border-zinc-800">
            <span className="text-gray-500">Account Number:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black text-brand-primary tracking-wider">
                {storeSettings.accountNumber}
              </span>
              <button
                type="button"
                onClick={copyAccount}
                className="p-1 rounded bg-gray-100 dark:bg-zinc-800 hover:bg-brand-primary/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                title="Copy Account Number"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center bg-brand-primary/5 dark:bg-brand-primary/10 p-3 rounded-xl border border-brand-primary/20">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
              Transfer Exact Total:
            </span>
            <span
              onClick={copyPrice}
              className="text-lg font-black text-brand-primary font-display select-all cursor-pointer hover:underline"
              title="Click to copy amount"
            >
              ₦{totalPrice.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={copyPrice}
            className="px-2.5 py-1.5 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold transition-all flex items-center gap-1.5 border border-brand-primary/20 cursor-pointer"
          >
            {copiedPrice ? (
              <>
                <Check size={13} className="text-emerald-500" />
                <span className="text-emerald-600 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy Amount</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          💡 <strong>Instructions:</strong> Please transfer the exact total{" "}
          <strong onClick={copyPrice} className="text-brand-primary font-bold cursor-pointer hover:underline">
            ₦{totalPrice.toLocaleString()}
          </strong>{" "}
          to the store account above. Our attendant will verify the alert live.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
