"use client";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";

export default function Logout() {
  const { logout } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    logout();
    const timer = setTimeout(() => router.push("/"), 2000);
    return () => clearTimeout(timer);
  }, [logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-primary">
          <LogOut size={40} />
        </div>
        <h2 className="text-2xl font-bold text-brand-dark mb-2">Signing you out...</h2>
        <p className="text-gray-500">You will be redirected to the homepage shortly.</p>
        <div className="mt-6 w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </motion.div>
    </div>
  );
}
