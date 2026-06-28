"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, Lock, ArrowRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { AuthContext } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in as admin, go to dashboard
  useEffect(() => {
    if (user?.role === "admin") {
      router.push("/admin");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      if (data.user.role !== "admin") {
        throw new Error("Access denied. Admin privileges required.");
      }

      login(data.user, data.token);
      router.push("/admin");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden px-4 font-sans text-white">
      {/* Dark Matrix-style Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-primary/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-[180px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#141414] border border-white/10 rounded-[2.5rem] shadow-2xl p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 rounded-2xl mb-6 text-brand-primary border border-brand-primary/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Admin <span className="text-brand-primary">Portal</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Secure Administrative Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Administrator Email</label>
            <Input
              type="email"
              placeholder="admin@amstores.com"
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })}
              className="bg-[#1a1a1a] border-white/5 text-white placeholder:text-gray-600 h-14 rounded-2xl focus:border-brand-primary/50"
              icon={<ShieldCheck size={18} className="text-gray-500" />}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Security Credentials</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })}
              className="bg-[#1a1a1a] border-white/5 text-white placeholder:text-gray-600 h-14 rounded-2xl focus:border-brand-primary/50"
              icon={<Lock size={18} className="text-gray-500" />}
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm p-4 rounded-2xl flex items-center gap-3"
            >
              <AlertTriangle size={18} />
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            className="w-full py-7 text-lg font-black rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-white shadow-brand-primary/20 shadow-2xl group transition-all cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                Authorize Access <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <Link href="/" className="text-gray-500 text-sm font-bold hover:text-white transition-colors uppercase tracking-widest">
            Return to Public Store
          </Link>
        </div>
      </motion.div>

      {/* Security Footer */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em] whitespace-nowrap opacity-50">
        Encrypted Endpoint · System Monitoring Active
      </div>
    </div>
  );
}
