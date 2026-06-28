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
  const [role, setRole] = useState("rider");
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
      if (data.user?.role !== role && !data.user?.isAdmin) {
        throw new Error(`You are not registered as a ${role === "rider" ? "Delivery Rider" : "Pickup Worker"}.`);
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
          <p className="text-gray-500 mt-2">Log in to view your assigned tasks.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] shadow-xl shadow-brand-dark/5 p-8 border border-gray-100">
          {/* Role Selector */}
          <div className="flex p-1 bg-gray-100 rounded-2xl mb-8 relative">
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${role === "rider" ? "left-1" : "left-[calc(50%+4px)]"}`} />
            <button type="button" onClick={() => { setRole("rider"); setError(""); }}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-sm font-medium transition-colors relative z-10 ${role === "rider" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Truck size={20} /> Delivery
            </button>
            <button type="button" onClick={() => { setRole("worker"); setError(""); }}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-sm font-medium transition-colors relative z-10 ${role === "worker" ? "text-orange-500" : "text-gray-500 hover:text-gray-700"}`}
            >
              <MapPin size={20} /> Pickup
            </button>
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
            <Button type="submit" disabled={loading} className={`w-full py-4 text-lg mt-2 flex items-center justify-center gap-2 ${role === "rider" ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25" : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25"}`}>
              {loading ? <Loader2 className="animate-spin" /> : <>{`Login as ${role === "rider" ? "Rider" : "Worker"}`} <ArrowRight size={20} /></>}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
