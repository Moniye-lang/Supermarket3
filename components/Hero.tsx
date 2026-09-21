"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Star, Zap, ShieldCheck, ShoppingBag } from "lucide-react";
import { Button } from "./ui/Button";

const CARDS_DATA = [
  {
    id: 1,
    className: "stream-card-1",
    tag: "Fresh Farm Produce · Direct Daily",
    title: "Farm-Fresh Strawberries & Greens",
    subtitle: "Chilled, organic, and hand-picked daily from vetted local growers for maximum nutrition.",
    price: "₦4,500 / basket",
    cta: "Shop Fresh Daily",
    image: "/AMstore1.jpg",
  },
  {
    id: 2,
    className: "stream-card-2",
    tag: "In-Store Gourmet · Akobo Supermarket",
    title: "Bakery, Dairy & Gourmet Pantry",
    subtitle: "Freshly baked artisan loaves, premium pantry staples, and imported essentials.",
    price: "₦2,800 / unit",
    cta: "Browse Groceries",
    image: "/IMG_4525.JPG",
  },
  {
    id: 3,
    className: "stream-card-3",
    tag: "Rapid Store Pickup · Ready in 30 Mins",
    title: "Prime Butchery & Daily Essentials",
    subtitle: "Quality poultry, prime meats, and all your supermarket favorites packed with care.",
    price: "₦6,500 / pack",
    cta: "Order for Pickup",
    image: "/IMG_4523.JPG",
  },
];

export default function Hero() {
  return (
    <section className="relative w-full min-h-[95vh] flex items-center bg-brand-light dark:bg-zinc-950 overflow-hidden pt-28 pb-16">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10 h-full">
        {/* ------------------------------------------------------------------ */}
        {/* LEFT COLUMN: Editorial Headline, Subtitle, CTAs & Metrics          */}
        {/* ------------------------------------------------------------------ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-5 space-y-7"
        >
          {/* Status badge pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-gray-200/80 dark:border-zinc-800 shadow-sm"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-primary"></span>
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">
              Delivering Freshness Daily · Akobo, Ibadan
            </span>
          </motion.div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-brand-dark dark:text-white leading-[1.06] tracking-tight">
            Your Groceries, <br />
            <span className="relative inline-block mt-2">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-red-600 to-orange-500">
                Perfected.
              </span>
              <span className="absolute bottom-2 left-0 w-full h-4 bg-brand-primary/15 -z-10 rounded-full blur-sm"></span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed font-normal">
            Skip the lines. We bring hand-picked supermarket essentials and farm-fresh produce directly to your doorstep in minutes. Quality you can taste, convenience you deserve.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/products">
              <Button
                size="lg"
                aria-label="Shop Now"
                className="h-13 sm:h-14 rounded-full px-8 text-base sm:text-lg hover:scale-105 transition-all duration-300 shadow-brand-primary/30 shadow-xl bg-gradient-to-r from-brand-primary to-red-600 border-none hover:shadow-2xl text-white font-bold"
              >
                Shop Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                aria-label="Learn More"
                className="h-13 sm:h-14 rounded-full px-8 text-base sm:text-lg border-2 border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-gray-200 hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary transition-all duration-300 font-bold"
              >
                Learn More
              </Button>
            </Link>
          </div>

          {/* Highlights & Trust badges */}
          <div className="pt-6 flex items-center gap-6 sm:gap-8 text-sm font-medium text-gray-700 dark:text-gray-300 border-t border-gray-200/80 dark:border-zinc-800">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Zap className="text-orange-500 w-5 h-5" />
                <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">30 Min</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Fast Delivery</span>
            </div>
            <div className="w-px h-10 bg-gray-200 dark:bg-zinc-800"></div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-green-500 w-5 h-5" />
                <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">100%</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Quality Assured</span>
            </div>
            <div className="w-px h-10 bg-gray-200 dark:bg-zinc-800"></div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Star className="text-yellow-500 w-5 h-5 fill-yellow-500" />
                <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">4.9/5</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Customer Rating</span>
            </div>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT COLUMN: 3-Card Staggered Continuous Card Stream Loop         */}
        {/* ------------------------------------------------------------------ */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="lg:col-span-7 flex items-center justify-center lg:justify-end relative min-h-[560px] sm:min-h-[620px] w-full overflow-visible"
        >
          {/* The 3D perspective stream viewport (Hover pauses motion) */}
          <div className="stream-perspective-viewport relative w-full max-w-xl h-[520px] sm:h-[580px] flex items-center justify-center lg:justify-end">
            {CARDS_DATA.map((card) => (
              <div
                key={card.id}
                className={`stream-card-anim ${card.className} group absolute w-full max-w-[480px] sm:max-w-[530px] flex overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xl border border-gray-100 dark:border-zinc-800 transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl cursor-pointer`}
              >
                {/* Content Side */}
                <div className="flex flex-1 flex-col justify-between pr-4 sm:pr-5 z-10 space-y-3">
                  <div>
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-brand-primary font-bold block">
                      {card.tag}
                    </span>
                    <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold leading-snug text-gray-900 dark:text-white">
                      {card.title}
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-[13px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {card.subtitle}
                    </p>
                    <div className="mt-2 text-sm sm:text-base font-extrabold text-brand-primary">
                      {card.price}
                    </div>
                  </div>

                  {/* CTA Button with Arrow Animation */}
                  <div className="mt-2">
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-2 rounded-full bg-brand-primary hover:bg-brand-primary-hover px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition-all duration-200 shadow-md group-hover:shadow-lg"
                    >
                      <span>{card.cta}</span>
                      <svg
                        className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* Image Side with Zoom Animation */}
                <div className="w-[50%] sm:w-[52%] overflow-hidden rounded-2xl relative min-h-[190px] sm:min-h-[220px] bg-gray-100 dark:bg-zinc-800 flex-shrink-0 shadow-inner">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 640px) 240px, 300px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    priority={card.id === 1}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
