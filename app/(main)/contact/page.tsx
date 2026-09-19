"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function ContactUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg("Please fill out all fields before submitting.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit message");

      setSuccessMsg(data.message || "Thank you! Your message has been sent successfully.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-20">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-brand-dark mb-4 sm:mb-6"
          >
            Get in <span className="text-brand-primary">Touch</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-gray-600 leading-relaxed"
          >
            Have a question, feedback, or need help with your store pickup? We would love to hear from you. Visit us in-store or send us a message below.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-16">

          {/* Contact Info Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="grid gap-4 sm:gap-5">
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                <div className="bg-brand-primary/10 p-3 rounded-2xl text-brand-primary shrink-0">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark text-base sm:text-lg mb-1">Our Location</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Ayegoro Junction, Kolapo Ishola Estate,<br />Akobo, Ibadan, Oyo State</p>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                <div className="bg-brand-primary/10 p-3 rounded-2xl text-brand-primary shrink-0">
                  <Phone size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark text-base sm:text-lg mb-1">Direct Call Line</h3>
                  <p className="text-sm text-gray-600">
                    <a href="tel:08023434790" className="hover:text-brand-primary font-semibold transition-colors">08023434790</a>
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                <div className="bg-brand-primary/10 p-3 rounded-2xl text-brand-primary shrink-0">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark text-base sm:text-lg mb-1">Email Address</h3>
                  <p className="text-sm text-gray-600">
                    <a href="mailto:amstores@gmail.com" className="hover:text-brand-primary transition-colors">amstores@gmail.com</a>
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                <div className="bg-brand-primary/10 p-3 rounded-2xl text-brand-primary shrink-0">
                  <Clock size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark text-base sm:text-lg mb-1">Store Hours</h3>
                  <p className="text-sm text-gray-600">Mon - Sat: 8:00 AM - 8:00 PM<br />Sun: 1:00 PM - 8:00 PM</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100">
              <h2 className="text-2xl font-bold text-brand-dark mb-6">Send us a Message</h2>

              <AnimatePresence mode="wait">
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-semibold flex items-center gap-2.5 mb-6"
                  >
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}

                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-sm font-semibold flex items-center gap-2.5 mb-6"
                  >
                    <AlertCircle size={20} className="text-red-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Your Full Name</label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Email Address</label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <label className="text-sm font-bold text-gray-700">Subject</label>
                <Input
                  placeholder="Order inquiry, feedback, or question..."
                  value={subject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-sm font-bold text-gray-700">Your Message</label>
                <textarea
                  className="w-full min-h-[140px] p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none bg-gray-50/50 text-sm text-gray-800"
                  placeholder="Tell us more about how we can help you..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-10 py-4 text-base shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Send Message <Send size={18} /></>}
              </Button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
