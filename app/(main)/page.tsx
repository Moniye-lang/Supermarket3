"use client";
import Hero from "@/components/Hero";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { ShoppingCart, Beef, Donut, Phone, Mail, MapPin, Clock, Tag, Truck, ArrowRight, ShieldCheck, Leaf, Store, PhoneCall, ShoppingBag, CupSoda, Egg, Sparkles, Smile } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { motion } from "framer-motion";

export default function Home() {
  const categories = [
    {
      Icon: ShoppingCart,
      label: "Groceries & Staples",
      tag: "150+ Products",
      description: "Everyday pantry essentials, fragrant long-grain rice, pure vegetable oils, rich seasonings, pastas, flour, and household cooking provisions.",
      subTags: ["Rice & Grains", "Cooking Oils", "Seasonings"],
      bg: "bg-red-50 dark:bg-red-950/30",
      color: "text-red-600 dark:text-red-400"
    },
    {
      Icon: Beef,
      label: "Frozen & Protein",
      tag: "85+ Cuts",
      description: "Quality prime beef, cleaned whole chicken, fresh sea fish, prawns, and chilled cold-cuts stored under continuous refrigeration.",
      subTags: ["Fresh Poultry", "Sea Fish", "Prime Beef"],
      bg: "bg-orange-50 dark:bg-orange-950/30",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      Icon: Donut,
      label: "Bakery & Snacks",
      tag: "Baked Daily",
      description: "Oven-warm sandwich loaves, golden meat pies, fluffy pastries, gourmet biscuits, cookies, and crunchy chips for all-day snacking.",
      subTags: ["Oven Bread", "Pastries", "Savory Snacks"],
      bg: "bg-amber-50 dark:bg-amber-950/30",
      color: "text-amber-600 dark:text-amber-400"
    },
    {
      Icon: Leaf,
      label: "Farm Fresh Produce",
      tag: "Farm Sourced",
      description: "Hand-selected ripe tomatoes, scotch bonnet peppers, crisp leafy greens, sweet seasonal fruits, and tubers straight from local growers.",
      subTags: ["Ripe Tomatoes", "Fresh Greens", "Sweet Fruits"],
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      color: "text-emerald-600 dark:text-emerald-400"
    },
    {
      Icon: CupSoda,
      label: "Drinks & Beverages",
      tag: "Chilled & Crisp",
      description: "Pure bottled water, 100% natural fruit juices, malts, energy drinks, soda packs, premium wines, and imported beverage mixes.",
      subTags: ["Pure Juices", "Energy Drinks", "Cold Sodas"],
      bg: "bg-blue-50 dark:bg-blue-950/30",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      Icon: Egg,
      label: "Dairy, Butter & Eggs",
      tag: "Pure & Fresh",
      description: "Fresh crate eggs, cultured yogurts, salted and unsalted butter blocks, imported cheese wheels, and rich whole dairy creams.",
      subTags: ["Farm Eggs", "Artisan Cheese", "Pure Butter"],
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      color: "text-yellow-600 dark:text-yellow-400"
    },
    {
      Icon: Sparkles,
      label: "Household & Cleaning",
      tag: "Home Essentials",
      description: "Heavy-duty laundry detergents, multi-surface disinfectants, air fresheners, soft paper towels, and kitchen cleaning essentials.",
      subTags: ["Detergents", "Disinfectants", "Paper Goods"],
      bg: "bg-purple-50 dark:bg-purple-950/30",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      Icon: Smile,
      label: "Personal Care & Hygiene",
      tag: "Daily Wellness",
      description: "Luxury bath soaps, moisturizing lotions, shampoos, oral hygiene kits, deodorants, baby care products, and wellness essentials.",
      subTags: ["Skin & Body", "Oral Care", "Baby Needs"],
      bg: "bg-rose-50 dark:bg-rose-950/30",
      color: "text-rose-600 dark:text-rose-400"
    }
  ];

  return (
    <div className="bg-brand-light w-full overflow-hidden">
      <Hero />

      {/* CATEGORIES SECTION */}
      <section className="py-20 md:py-28 relative bg-white dark:bg-zinc-950 transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
            <div className="max-w-2xl">
              <span className="text-brand-primary font-semibold tracking-wider text-sm uppercase flex items-center gap-2">
                <span className="w-8 h-1 bg-brand-primary rounded-full"></span>
                What We Offer
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold text-brand-dark dark:text-white mt-3">
                Shop By Category
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base mt-2">
                Explore our full range of supermarket departments with guaranteed freshness and express in-store pickup.
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline" aria-label="View All Categories" className="rounded-full px-6 py-2.5 hover:bg-brand-dark hover:text-white transition-colors border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-gray-200">
                View All Categories <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            {categories.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="h-full"
              >
                <Link href={`/products?category=${encodeURIComponent(item.label)}`} className="block h-full">
                  <Card className="h-full min-h-[350px] border border-gray-100 dark:border-zinc-800/80 shadow-md hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-300 rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 group cursor-pointer flex flex-col justify-between">
                    <CardContent className="p-7 sm:p-8 flex flex-col h-full relative z-10 justify-between">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-50 dark:from-zinc-800 to-transparent rounded-bl-full -z-10 group-hover:from-brand-primary/10 transition-colors"></div>

                      <div>
                        {/* Top Row: Icon + Badge */}
                        <div className="flex items-center justify-between mb-6">
                          <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                            <item.Icon size={26} />
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                            {item.tag}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-white mb-2.5 font-display group-hover:text-brand-primary transition-colors">
                          {item.label}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed mb-5">
                          {item.description}
                        </p>

                        {/* Subcategory Pills */}
                        <div className="flex flex-wrap gap-1.5 mb-6">
                          {item.subTags.map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800/80 border border-gray-100 dark:border-zinc-700 px-2.5 py-1 rounded-lg"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Footer Action Row */}
                      <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-brand-dark dark:text-white group-hover:text-brand-primary transition-colors mt-auto">
                        <span>Explore Department</span>
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all">
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STORE PICKUP SECTION (100vh) */}
      <section className="min-h-screen lg:h-screen w-full flex items-center justify-center bg-brand-dark text-white relative overflow-hidden py-12 lg:py-0">
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-brand-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-8 lg:gap-14 items-center relative z-10 max-h-full">

          <div className="relative h-[360px] sm:h-[420px] lg:h-[480px] xl:h-[520px] flex items-center justify-center order-2 lg:order-1">
            <div className="absolute inset-0 bg-white/5 rounded-[3rem] -rotate-6 transform border border-white/10" />
            <div className="absolute inset-3 sm:inset-4 rounded-[2.5rem] overflow-hidden">
              <Image
                src="/IMG_4542.JPG"
                alt="Store Pickup"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                className="object-cover opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-700"
                loading="lazy"
                quality={75}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="absolute -right-3 sm:-right-6 top-1/3 bg-white text-brand-dark p-3 sm:p-4 rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-4 z-20"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Store size={22} />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Status</p>
                <p className="font-bold text-sm sm:text-lg leading-tight text-gray-900">Ready for Pickup</p>
              </div>
            </motion.div>
          </div>

          <div className="space-y-4 sm:space-y-5 order-1 lg:order-2 max-w-xl">
            <div>
              <span className="text-brand-primary font-semibold tracking-wider text-xs uppercase flex items-center gap-2 mb-2">
                <span className="w-8 h-1 bg-brand-primary rounded-full"></span>
                Express Store Pickup
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold leading-tight text-white">
                Instant Pickup <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-500">Ready on Arrival.</span>
              </h2>
            </div>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Skip the checkout queues entirely. Order ahead online, and our staff will hand-pick and carefully pack your items ready for collection at AMStores, General Gas Road, Akobo.
            </p>

            <div className="space-y-2.5 sm:space-y-3">
              <FeatureItem
                icon={Clock}
                title="Swift 15-Minute Preparation"
                desc="Your order is packed and waiting at our counter shortly after your payment is confirmed."
              />
              <FeatureItem
                icon={ShieldCheck}
                title="Fresh & Cold-Chain Guarantee"
                desc="Frozen foods and perishables are kept in optimal refrigerated storage until you collect them."
              />
              <FeatureItem
                icon={PhoneCall}
                title="1-Click Call on Arrival"
                desc="Call our store frontdesk with a single tap on arrival and our team will bring your items out."
              />
            </div>

            <div className="pt-2">
              <Link href="/products">
                <Button size="lg" aria-label="Order for Pickup Now" className="rounded-full px-7 sm:px-8 py-4 sm:py-5 text-sm sm:text-base font-bold bg-brand-primary hover:bg-brand-primary-hover text-white shadow-xl shadow-brand-primary/30 group">
                  <span>Order for In-Store Pickup</span>
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
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

function FeatureItem({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group cursor-default">
      <div className="bg-white/10 p-2 sm:p-2.5 rounded-xl shrink-0 group-hover:bg-brand-primary group-hover:scale-105 transition-all duration-300">
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <h4 className="font-bold text-xs sm:text-sm mb-0.5 text-white/90">{title}</h4>
        <p className="text-gray-300 text-[11px] sm:text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

