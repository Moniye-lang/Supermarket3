"use client";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Building, CreditCard, ShieldCheck, CheckCircle, AlertCircle, Loader2, Phone, Mail, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function AdminSettingsPage() {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    paymentInstructions: "",
    storePhone: "",
    storeEmail: "",
    storeAddress: "",
  });

  useEffect(() => {
    async function fetchSettings() {
      const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      if (!currentToken) return;

      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/admin/settings`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        const data = await res.json();
        if (res.ok && data.settings) {
          setForm({
            bankName: data.settings.bankName || "",
            accountNumber: data.settings.accountNumber || "",
            accountName: data.settings.accountName || "",
            paymentInstructions: data.settings.paymentInstructions || "",
            storePhone: data.settings.storePhone || "",
            storeEmail: data.settings.storeEmail || "",
            storeAddress: data.settings.storeAddress || "",
          });
        }
      } catch (err: any) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [token]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      setMessage({ type: "success", text: "Store Payment & Account settings updated successfully! Customers will now see these bank details during checkout." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save changes" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-primary" size={36} />
        <p className="text-sm font-bold text-gray-500">Loading store settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Store Settings &amp; Payment Methods</h1>
          <p className="text-gray-500 text-sm mt-1">Configure customer payment account details and store contact info.</p>
        </div>
        <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-bold flex items-center gap-1.5">
          <ShieldCheck size={14} /> Admin Verified
        </div>
      </div>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {message.type === "success" ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Bank Account Details Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
              <CreditCard size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Customer Transfer Account Details</h2>
              <p className="text-xs text-gray-500">This account number is shown to customers at checkout and during order payment.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Bank Name</label>
              <Input
                placeholder="e.g. Zenith Bank, GTBank, Access Bank"
                value={form.bankName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, bankName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Account Number</label>
              <Input
                placeholder="e.g. 1012345678"
                value={form.accountNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, accountNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold text-gray-700">Account Name</label>
              <Input
                placeholder="e.g. AMStores Supermarket / Agbeni Mercantile Stores"
                value={form.accountName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, accountName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold text-gray-700">Payment Instructions / Narration Note</label>
              <textarea
                className="w-full min-h-[90px] p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none text-sm text-gray-800"
                placeholder="Instructions shown to customers when making transfers..."
                value={form.paymentInstructions}
                onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
              />
            </div>
          </div>

          {/* Customer Preview Pill */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-brand-primary/20 rounded-2xl p-5">
            <p className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Live Preview for Customers:</p>
            <div className="bg-white rounded-xl p-4 border border-brand-primary/15 shadow-sm space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Bank:</span>
                <span className="font-bold text-gray-900">{form.bankName || "Bank Name"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Account Number:</span>
                <span className="font-mono font-black text-brand-primary text-base">{form.accountNumber || "0000000000"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Account Name:</span>
                <span className="font-semibold text-gray-800">{form.accountName || "AMStores Ltd"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Store Contact & Address */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Store Frontdesk Contact &amp; Location</h2>
              <p className="text-xs text-gray-500">Contact details shown on customer receipts and store pickup calls.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Official Store Phone</label>
              <Input
                placeholder="08023434790"
                value={form.storePhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, storePhone: e.target.value })}
                icon={<Phone size={16} className="text-gray-400" />}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Official Store Email</label>
              <Input
                type="email"
                placeholder="amstores@gmail.com"
                value={form.storeEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, storeEmail: e.target.value })}
                icon={<Mail size={16} className="text-gray-400" />}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold text-gray-700">Store Physical Address</label>
              <Input
                placeholder="Ayegoro Junction, Kolapo Ishola Estate, Akobo, Ibadan"
                value={form.storeAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, storeAddress: e.target.value })}
                icon={<MapPin size={16} className="text-gray-400" />}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="py-4 px-10 text-base bg-brand-primary hover:bg-brand-primary-hover text-white shadow-xl shadow-brand-primary/25 rounded-2xl flex items-center gap-2 font-bold cursor-pointer"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Save Settings</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
