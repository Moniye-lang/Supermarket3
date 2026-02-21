import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Star, Zap } from "lucide-react";
import { Button } from "./ui/Button";

export default function Hero() {
    return (
        <section className="relative w-full min-h-[95vh] flex items-center bg-brand-light overflow-hidden pt-20">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

            <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-8"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm"
                    >
                        <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                        </span>
                        <span className="text-sm font-semibold text-brand-dark tracking-wide">#1 Grocery Delivery in Ibadan</span>
                    </motion.div>

                    <h1 className="text-6xl lg:text-8xl font-display font-bold text-brand-dark leading-[1.1] tracking-tight">
                        Freshness <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-600">
                            Redefined.
                        </span>
                    </h1>

                    <p className="text-xl text-gray-600 max-w-xl leading-relaxed">
                        Elevate your lifestyle with premium groceries delivered in minutes. Experience the perfect blend of quality, speed, and care.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <Link to="/Order">
                            <Button size="lg" className="rounded-full px-8 text-lg hover:scale-105 transition-transform shadow-brand-primary/25 shadow-xl">
                                Start Shopping <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link to="/Products">
                            <Button variant="glass" size="lg" className="rounded-full px-8 text-lg border-2 border-white/50 hover:border-brand-primary/20">
                                View Catalog
                            </Button>
                        </Link>
                    </div>

                    <div className="pt-8 flex items-center gap-8 text-sm font-medium text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1.5 rounded-full text-green-600"><Zap size={16} fill="currentColor" /></div>
                            <span>30m Delivery</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-yellow-100 p-1.5 rounded-full text-yellow-600"><Star size={16} fill="currentColor" /></div>
                            <span>5-Star Service</span>
                        </div>
                    </div>
                </motion.div>

                {/* Visuals */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative h-[600px] hidden lg:block"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent rounded-[3rem] -rotate-3 transform border border-white/20" />

                    {/* Main Image Masked */}
                    <div className="absolute inset-4 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-brand-dark/10 bg-white">
                        <img
                            src="/AMstore1.jpg"
                            alt="Premium Groceries"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                        {/* Floating Cards */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="absolute bottom-8 left-8 right-8 p-6 glass-dark rounded-2xl border border-white/10"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Featured</p>
                                    <p className="text-white text-lg font-display font-medium">Organic Fresh Produce</p>
                                </div>
                                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-brand-primary">
                                    <ShoppingBag size={20} />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Decorative Elements */}
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        className="absolute -top-12 -right-12 w-24 h-24 bg-brand-primary rounded-3xl -rotate-12 flex items-center justify-center shadow-2xl z-20"
                    >
                        <span className="font-display font-bold text-white text-3xl">100%</span>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

