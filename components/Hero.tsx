"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Star, Zap, ShieldCheck } from "lucide-react";
import { Button } from "./ui/Button";

export default function Hero() {
    return (
        <section className="relative w-full min-h-[95vh] flex items-center bg-brand-light overflow-hidden pt-24 pb-12">
            {/* Dynamic Background Gradients */}
            <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-400/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center relative z-10 h-full">

                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="lg:col-span-6 space-y-8"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-xl border border-white shadow-sm light-card"
                    >
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-primary"></span>
                        </span>
                        <span className="text-sm font-bold text-black dark:text-white tracking-wide uppercase">Delivering Freshness Daily</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-extrabold text-brand-dark leading-[1.05] tracking-tight">
                        Your Groceries, <br />
                        <span className="relative inline-block mt-2">
                            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-red-600 to-orange-500">
                                Perfected.
                            </span>
                            <span className="absolute bottom-2 left-0 w-full h-4 bg-brand-primary/10 -z-10 rounded-full blur-sm"></span>
                        </span>
                    </h1>

                    <p className="text-xl text-gray-600 max-w-lg leading-relaxed font-light">
                        Skip the lines. We bring the finest, hand-picked essentials directly to your door in minutes. Quality you can taste, convenience you deserve.
                    </p>

                    <div className="flex flex-wrap gap-5 pt-4">
                        <Link href="/products">
                            <Button size="lg" className="h-14 rounded-full px-8 text-lg hover:scale-105 transition-all duration-300 shadow-brand-primary/30 shadow-xl bg-gradient-to-r from-brand-primary to-red-600 border-none hover:shadow-2xl">
                                Shop Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/about">
                            <Button variant="outline" size="lg" className="h-14 rounded-full px-8 text-lg border-2 border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary transition-all duration-300">
                                Learn More
                            </Button>
                        </Link>
                    </div>

                    <div className="pt-10 flex items-center gap-6 md:gap-10 text-sm font-medium text-gray-600">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Zap className="text-orange-500 w-5 h-5" />
                                <span className="font-bold text-gray-900 text-lg">30 Min</span>
                            </div>
                            <span className="text-xs text-gray-500">Fast Delivery</span>
                        </div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="text-green-500 w-5 h-5" />
                                <span className="font-bold text-gray-900 text-lg">100%</span>
                            </div>
                            <span className="text-xs text-gray-500">Quality Assured</span>
                        </div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Star className="text-yellow-500 w-5 h-5 fill-yellow-500" />
                                <span className="font-bold text-gray-900 text-lg">4.9/5</span>
                            </div>
                            <span className="text-xs text-gray-500">Customer Rating</span>
                        </div>
                    </div>
                </motion.div>

                {/* Right Visuals */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="lg:col-span-6 relative h-[650px] hidden lg:block"
                >
                    <div className="absolute top-10 right-0 w-[85%] h-[85%] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-gray-100 z-10">
                        <img
                            src="/AMstore1.jpg"
                            alt="Premium Groceries"
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-[2000ms] ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-dark/40 to-transparent"></div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="absolute bottom-0 left-0 w-64 h-80 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white bg-gray-100 z-20"
                    >
                        <img
                            src="/IMG_4525.JPG"
                            alt="Fresh Produce"
                            className="w-full h-full object-cover"
                        />
                    </motion.div>

                    {/* Floating Element */}
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                        className="absolute top-20 left-10 p-5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 z-30 flex items-center gap-4 light-card"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-black dark:text-white font-medium">Just ordered</p>
                            <p className="text-black dark:text-white font-bold">Fresh Strawberries</p>
                        </div>
                    </motion.div>

                </motion.div>
            </div>
        </section>
    );
}
