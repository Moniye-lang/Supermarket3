"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, MapPin, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function WorkerLogin() {
  const role = "worker";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) return setError("Enter all fields.");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      if (data.user?.role !== "worker" && data.user?.role !== "admin") {
        throw new Error("You are not registered as a Store Staff Member.");
      }
      localStorage.setItem("workerToken", data.token);
      router.push("/worker");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <span className="font-display text-3xl font-bold tracking-tight text-brand-dark">AM<span className="text-brand-primary">Stores</span></span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Staff Portal</h1>
          <p className="text-gray-500 mt-2">Log in to view your store tasks &amp; pickups.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] shadow-xl shadow-brand-dark/5 p-8 border border-gray-100">
          <div className="flex items-center justify-center gap-2 p-3 bg-brand-primary/10 text-brand-primary rounded-2xl mb-8 font-bold text-sm">
            <MapPin size={18} /> Store Fulfillment Staff
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-6 font-medium text-center border border-red-100 overflow-hidden">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <Input type="email" placeholder="staff@amstores.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full py-4 text-lg mt-2 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white shadow-brand-primary/25">
              {loading ? <Loader2 className="animate-spin" /> : <>Login to Staff Portal <ArrowRight size={20} /></>}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
