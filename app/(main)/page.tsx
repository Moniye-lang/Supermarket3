"use client";
import Hero from "@/components/Hero";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { ShoppingCart, Beef, Donut, Phone, Mail, MapPin, Clock, Tag, Truck, ArrowRight, ShieldCheck, Leaf, Store, PhoneCall, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { motion } from "framer-motion";

export default function Home() {
  const categories = [
    {
      Icon: ShoppingCart,
      label: "Groceries & Staples",
      description: "Pantry essentials, beverages, toiletries, and daily household needs.",
      bg: "bg-red-50",
      color: "text-red-600"
    },
    {
      Icon: Beef,
      label: "Frozen & Protein",
      description: "Premium cuts of meat, fresh fish, chicken, and frozen delights.",
      bg: "bg-orange-50",
      color: "text-orange-600"
    },
    {
      Icon: Donut,
      label: "Bakery & Snacks",
      description: "Oven-fresh bread, pastries, cakes, and your favorite snacks.",
      bg: "bg-yellow-50",
      color: "text-yellow-600"
    },
    {
      Icon: Leaf,
      label: "Farm Fresh Produce",
      description: "Crisp vegetables and sweet fruits sourced directly from local farms.",
      bg: "bg-green-50",
      color: "text-green-600"
    }
  ];

  return (
    <div className="bg-brand-light w-full overflow-hidden">
      <Hero />

      {/* CATEGORIES SECTION */}
      <section className="py-16 md:py-20 relative bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <span className="text-brand-primary font-semibold tracking-wider text-sm uppercase flex items-center gap-2">
                <span className="w-8 h-1 bg-brand-primary rounded-full"></span>
                What We Offer
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold text-brand-dark mt-3">Shop By Category</h2>
            </div>
            <Link href="/products">
              <Button variant="outline" aria-label="View All Categories" className="rounded-full px-6 hover:bg-brand-dark hover:text-white transition-colors border-gray-300 text-gray-800">
                View All Categories <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -6 }}
              >
                <Link href={`/products?category=${encodeURIComponent(item.label)}`} className="block h-full">
                  <Card className="h-full border border-gray-100 shadow-md hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-300 rounded-[1.75rem] overflow-hidden bg-white group cursor-pointer">
                    <CardContent className="p-6 flex flex-col h-full relative z-10">
                      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full -z-10 group-hover:from-brand-primary/5 transition-colors"></div>

                      <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-5 shadow-xs group-hover:scale-105 transition-transform duration-300`}>
                        <item.Icon size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-brand-dark mb-2 font-display">{item.label}</h3>
                      <p className="text-gray-600 mb-6 flex-grow text-xs leading-relaxed">{item.description}</p>

                      <div className="flex items-center text-xs font-semibold text-brand-dark group-hover:text-brand-primary transition-colors mt-auto">
                        Explore <ArrowRight className="ml-2 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STORE PICKUP SECTION */}
      <section className="py-14 md:py-18 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">

          <div className="relative h-[320px] md:h-[380px] lg:col-span-5 flex items-center justify-center order-2 lg:order-1">
            <div className="absolute inset-0 bg-white/5 rounded-[2.5rem] -rotate-3 transform border border-white/10" />
            <div className="absolute inset-3 rounded-[2rem] overflow-hidden">
              <Image
                src="/IMG_4542.JPG"
                alt="Store Pickup"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-700"
                loading="lazy"
                quality={75}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="absolute -right-4 md:-right-6 bottom-6 bg-white text-brand-dark px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-100"
            >
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <Store size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Pickup Status</p>
                <p className="font-bold text-sm leading-tight text-gray-900">Ready on Arrival</p>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6 lg:col-span-7 order-1 lg:order-2">
            <div>
              <span className="text-brand-primary font-semibold tracking-wider text-xs uppercase flex items-center gap-2 mb-2.5">
                <span className="w-6 h-1 bg-brand-primary rounded-full"></span>
                Express Store Pickup
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight text-white">
                Instant Pickup ·{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-500">
                  Ready on Arrival.
                </span>
              </h2>
            </div>

            <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl">
              Skip the checkout queues entirely. Order ahead online, and our staff will hand-pick and carefully pack your items ready for quick collection at AMStores, General Gas Road, Akobo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white leading-tight">15-Min Prep</h4>
                  <p className="text-gray-400 text-[11px]">Packed at counter</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white leading-tight">Cold-Chain Safe</h4>
                  <p className="text-gray-400 text-[11px]">Perishables chilled</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PhoneCall size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white leading-tight">Curbside Call</h4>
                  <p className="text-gray-400 text-[11px]">Brought to car</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/products">
                <Button size="lg" aria-label="Order for Pickup Now" className="rounded-full px-7 py-5 text-sm font-bold bg-brand-primary hover:bg-brand-primary-hover text-white shadow-lg shadow-brand-primary/25 group">
                  <span>Order for In-Store Pickup</span>
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT / STORY SECTION */}
      <section className="py-16 md:py-20 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="grid lg:grid-cols-2 gap-10 md:gap-14 items-center">

              {/* Content */}
              <div className="space-y-6">
                <span className="text-brand-primary font-semibold tracking-wider text-xs uppercase flex items-center gap-2">
                  <span className="w-6 h-1 bg-brand-primary rounded-full"></span>
                  Our Story
                </span>
                <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-brand-dark leading-tight">
                  More than a market, <br />
                  <span className="text-gray-500 font-light">it's a lifestyle.</span>
                </h2>
                <p className="text-base text-gray-700 leading-relaxed font-normal">
                  Our journey began with a simple mission: to revolutionize how you shop for essentials. We combine the warmth of local service with the efficiency of modern technology.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed font-normal">
                  At AMStores, we believe quality shouldn't be a luxury. From fresh produce to pantry staples, every item is hand-picked to ensure it meets our rigorous standards before it reaches your home.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 pt-3">
                  <Link href="/about">
                    <Button size="lg" aria-label="Read Our Story" className="rounded-full px-7 bg-brand-dark hover:bg-black text-white w-full sm:w-auto text-sm">Read Our Story</Button>
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-gray-700 font-medium">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                      <MapPin size={18} />
                    </div>
                    <p>Ayegoro Junction,<br />Akobo, Ibadan</p>
                  </div>
                </div>
              </div>

              {/* Gallery */}
              <div className="relative h-[340px] md:h-[400px]">
                <div className="absolute inset-0 bg-brand-primary/5 rounded-[2rem] transform translate-x-3 translate-y-3"></div>
                <Image
                  src="/IMG_E4522.JPG"
                  alt="Our Store"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="relative z-10 object-cover rounded-[2rem] shadow-lg"
                />
                <a
                  href="tel:08023434790"
                  className="absolute -bottom-4 -left-4 z-20 bg-white p-4 rounded-xl shadow-lg max-w-[220px] border border-gray-100 hidden md:block hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Phone className="text-brand-primary w-4 h-4" />
                    <span className="font-bold text-xs text-gray-900">Need Help?</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Call for quick orders.</p>
                  <p className="font-bold text-brand-primary text-sm">0802 343 4790</p>
                </a>
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

