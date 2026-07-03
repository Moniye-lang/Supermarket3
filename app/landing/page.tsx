"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, ShoppingBag, ArrowRight, Sparkles, Store } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [choice, setChoice] = useState<string | null>(null);

  const handleEnter = () => {
    if (choice === "user") {
      router.push("/signin");
    } else if (choice === "guest") {
      const guestId = `guest_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      localStorage.setItem("guestId", guestId);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/"); // Redirect guest to homepage
    } else {
      alert("Please choose how you want to enter.");
    }
  };

  const backgroundParticles = [
    { icon: "🍎", size: "text-3xl", top: "15%", left: "8%", delay: 0 },
    { icon: "🥦", size: "text-4xl", top: "72%", left: "12%", delay: 2.2 },
    { icon: "🥖", size: "text-3xl", top: "22%", left: "82%", delay: 1.4 },
    { icon: "🥩", size: "text-4xl", top: "68%", left: "86%", delay: 0.8 },
    { icon: "🥛", size: "text-2xl", top: "45%", left: "6%", delay: 3.1 },
    { icon: "🛍️", size: "text-3xl", top: "82%", left: "78%", delay: 2.5 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };


  return (
    <div className="relative flex flex-col w-full items-center justify-center h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-red-50/20 text-brand-dark font-sans overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-amber-50/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Background Particles */}
      {backgroundParticles.map((particle, index) => (
        <motion.div
          key={index}
          className={`absolute select-none pointer-events-none opacity-20 ${particle.size}`}
          style={{ top: particle.top, left: particle.left }}
          animate={{
            y: [0, -35, 0],
            rotate: [0, 15, -15, 0],
            opacity: [0.12, 0.3, 0.12]
          }}
          transition={{
            duration: 8 + index * 2.5,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        >
          {particle.icon}
        </motion.div>
      ))}

      {/* Main Glassmorphic Panel Card */}
      <motion.div 
        className="w-[90%] max-w-md bg-white/80 backdrop-blur-md border border-white/60 shadow-2xl shadow-zinc-200/50 rounded-[2.5rem] p-8 sm:p-10 relative z-10 text-center"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          {/* Circular Animated Brand Badge */}
          <motion.div 
            className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6 text-brand-primary border border-brand-primary/20"
            variants={itemVariants}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Store size={32} />
          </motion.div>

          {/* Heading */}
          <motion.h1 
            className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight text-brand-dark flex items-center gap-1.5"
            variants={itemVariants}
          >
            Welcome to <span className="text-brand-primary font-display tracking-wide">AMstores</span>
          </motion.h1>

          {/* Slogan subtext */}
          <motion.p 
            className="text-zinc-500 text-sm mb-8 font-medium max-w-xs leading-relaxed"
            variants={itemVariants}
          >
            Choose your preferred entry method to browse our premium catalog of grocery and bakery essentials.
          </motion.p>

          {/* Choices Row (Staggered Entrance, Custom Hover lift & border grow) */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 w-full mb-8 justify-center"
            variants={itemVariants}
          >
            {/* User Option Card */}
            <motion.label
              className={`cursor-pointer px-6 py-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 flex-1 transition-colors duration-300 relative overflow-hidden select-none ${
                choice === "user"
                  ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20 font-bold"
                  : "bg-white border-zinc-100 hover:border-brand-primary/30 text-zinc-700"
              }`}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="radio"
                name="entry"
                value="user"
                className="hidden"
                onChange={() => setChoice("user")}
              />
              <User size={24} className={choice === "user" ? "text-white animate-bounce" : "text-zinc-400"} />
              <span className="text-xs uppercase tracking-wider font-extrabold">Enter as User</span>
            </motion.label>

            {/* Guest Option Card */}
            <motion.label
              className={`cursor-pointer px-6 py-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 flex-1 transition-colors duration-300 relative overflow-hidden select-none ${
                choice === "guest"
                  ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20 font-bold"
                  : "bg-white border-zinc-100 hover:border-brand-primary/30 text-zinc-700"
              }`}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="radio"
                name="entry"
                value="guest"
                className="hidden"
                onChange={() => setChoice("guest")}
              />
              <ShoppingBag size={24} className={choice === "guest" ? "text-white animate-bounce" : "text-zinc-400"} />
              <span className="text-xs uppercase tracking-wider font-extrabold">Enter as Guest</span>
            </motion.label>
          </motion.div>

          {/* Continue CTA Button with Stagger & Pulsing state check */}
          <motion.button
            onClick={handleEnter}
            className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white py-4 rounded-2xl shadow-xl shadow-brand-primary/10 transition-all duration-300 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-brand-primary-hover"
            variants={itemVariants}
            whileHover={{ scale: 1.015, boxShadow: "0 12px 28px -4px rgba(173, 52, 62, 0.25)" }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Continue to Shop</span>
            <ArrowRight size={16} />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Footer copyright */}
      <motion.footer 
        className="absolute bottom-5 text-[10px] text-zinc-400 uppercase font-bold tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        © {new Date().getFullYear()} AMstores — All Rights Reserved
      </motion.footer>
    </div>
  );
}
