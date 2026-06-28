"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  User,
  Bot,
  Sparkles,
  ChevronRight,
  ShoppingBag,
  Clock,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AM_BOT_RESPONSES: Record<string, string | string[]> = {
  greetings: [
    "Hi there! Welcome to AMstores. I'm your AI shopping assistant. How can I help you today?",
    "Hello! Looking for something special? I'm here to help you navigate our store.",
    "Hey! I'm AM-Bot. Ready to help you find the best deals at AMstores!"
  ],
  shipping: "We offer standard and express shipping. Orders above ₦100k get free standard shipping! Delivery usually takes 30-45 minutes within Ibadan.",
  returns: "Our return policy allows you to return items within 30 days of purchase. Make sure to keep the receipt and original packaging.",
  tracking: "You can track your order in the 'Order' section once you're logged in.",
  contact: "You can reach our support team at support@amstores.com or call us at 0802 343 4790.",
  default: "That's a great question! While I'm still learning, I can help you with store hours, shipping, returns, or finding products. Would you like to speak with a human agent?"
};

interface Message {
  id: number;
  text: string;
  sender: "bot" | "user";
  timestamp: Date;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm AM-Bot, your personal shopping assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const getBotResponse = (input: string): string => {
    const text = input.toLowerCase();

    if (text.match(/^(hi|hello|hey|greetings)/)) {
      const arr = AM_BOT_RESPONSES.greetings as string[];
      return arr[Math.floor(Math.random() * arr.length)];
    }
    if (text.includes("ship") || text.includes("delivery")) return AM_BOT_RESPONSES.shipping as string;
    if (text.includes("return") || text.includes("refund")) return AM_BOT_RESPONSES.returns as string;
    if (text.includes("track") || text.includes("where is my order")) return AM_BOT_RESPONSES.tracking as string;
    if (text.includes("contact") || text.includes("support") || text.includes("help")) return AM_BOT_RESPONSES.contact as string;

    return AM_BOT_RESPONSES.default as string;
  };

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/chatbot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-5),
        }),
      });

      const data = await response.json();

      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.response || getBotResponse(text),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: getBotResponse(text),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    { label: "Track Order", icon: <Clock size={14} /> },
    { label: "Shipping Info", icon: <ShoppingBag size={14} /> },
    { label: "Customer Support", icon: <HelpCircle size={14} /> },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] sm:h-[600px] bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-brand-primary p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                    <Bot size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">AM-Bot</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">AI Assistant</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.sender === "bot" ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.sender === "bot" ? "flex-row" : "flex-row-reverse"}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.sender === "bot" ? "bg-brand-primary text-white" : "bg-white text-slate-400 border border-slate-100"
                    }`}>
                      {msg.sender === "bot" ? <Sparkles size={14} /> : <User size={14} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.sender === "bot"
                        ? "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                        : "bg-brand-primary text-white rounded-tr-none"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-brand-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-brand-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-brand-primary/40 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions & Input */}
            <div className="p-4 bg-white border-t border-slate-100 space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.label)}
                    className="whitespace-nowrap px-4 py-2 bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-brand-primary/30 rounded-xl text-xs font-semibold text-slate-600 hover:text-brand-primary transition-all flex items-center gap-2"
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask AM-Bot something..."
                  className="w-full bg-slate-50 border border-slate-200 pl-4 pr-12 py-3 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none transition-all text-sm"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-brand-primary text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-brand-primary text-white rounded-2xl shadow-lg flex items-center justify-center relative group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle size={28} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-brand-primary flex items-center justify-center">
                <Sparkles size={8} className="text-white" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <div className="absolute right-20 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none flex items-center gap-2">
            Chat with AM-Bot <ChevronRight size={12} />
          </div>
        )}
      </motion.button>
    </div>
  );
}
