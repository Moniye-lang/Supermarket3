"use client";
import Hero from "@/components/Hero";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { ShoppingCart, Beef, Donut, Phone, Mail, MapPin, Clock, Tag, Truck, ArrowRight, ShieldCheck, Leaf } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { motion } from "framer-motion";

export default function Home() {

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
      <section className="py-32 relative bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-brand-primary font-semibold tracking-wider text-sm uppercase flex items-center gap-2">
                <span className="w-8 h-1 bg-brand-primary rounded-full"></span>
                What We Offer
              </span>
              <h2 className="text-4xl md:text-6xl font-display font-extrabold text-brand-dark mt-4">Shop By Category</h2>
            </div>
            <Link href="/products">
              <Button variant="outline" aria-label="View All Categories" className="rounded-full px-6 hover:bg-brand-dark hover:text-white transition-colors border-gray-300 text-gray-800">
                View All Categories <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -10 }}
              >
                <Card className="h-full border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-300 rounded-[2rem] overflow-hidden bg-white group cursor-pointer">
                  <CardContent className="p-8 flex flex-col h-full relative z-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full -z-10 group-hover:from-brand-primary/5 transition-colors"></div>

                    <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <item.Icon size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-brand-dark mb-3 font-display">{item.label}</h3>
                    <p className="text-gray-600 mb-8 flex-grow text-sm leading-relaxed">{item.description}</p>

                    <div className="flex items-center text-sm font-semibold text-brand-dark group-hover:text-brand-primary transition-colors mt-auto">
                      Explore <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM DELIVERY SECTION */}
      <section className="py-32 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center relative z-10">

          <div className="relative h-[600px] flex items-center justify-center order-2 lg:order-1">
            <div className="absolute inset-0 bg-white/5 rounded-[3rem] -rotate-6 transform border border-white/10" />
            <div className="absolute inset-4 rounded-[2.5rem] overflow-hidden">
              <Image
                src="/IMG_4542.JPG"
                alt="Delivery Box"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-700"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="absolute -right-8 top-1/3 bg-white text-brand-dark p-4 rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Truck size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Status</p>
                <p className="font-bold text-lg leading-tight text-gray-900">Arriving in 15m</p>
              </div>
            </motion.div>
          </div>

          <div className="space-y-10 order-1 lg:order-2">
            <div>
              <span className="text-brand-primary font-semibold tracking-wider text-sm uppercase flex items-center gap-2 mb-4">
                <span className="w-8 h-1 bg-brand-primary rounded-full"></span>
                Logistics & Delivery
              </span>
              <h2 className="text-5xl lg:text-7xl font-display font-bold leading-tight text-white">
                Premium Delivery <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-orange-500">Straight to You.</span>
              </h2>
            </div>

            <p className="text-gray-300 text-lg leading-relaxed">
              We've optimized every step of the process. From our shelves to your doorstep, our dedicated riders ensure your order arrives fresh, fast, and exactly as you expected.
            </p>

            <div className="space-y-6">
              <FeatureItem
                icon={Clock}
                title="Ultra-Fast 30-Minute Delivery"
                desc="Our optimized routing ensures lightning-fast delivery within the Ibadan metropolis."
              />
              <FeatureItem
                icon={ShieldCheck}
                title="Cold-Chain Guarantee"
                desc="Frozen foods and perishables are transported in temperature-controlled bags."
              />
              <FeatureItem
                icon={Tag}
                title="Best Market Prices"
                desc="Enjoy competitive pricing and exclusive app-only discounts without compromising on quality."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT / STORY SECTION */}
      <section className="py-32 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-gray-200/50 border border-gray-100">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Content */}
              <div className="space-y-8">
                <span className="text-brand-primary font-semibold tracking-wider text-sm uppercase flex items-center gap-2">
                  <span className="w-8 h-1 bg-brand-primary rounded-full"></span>
                  Our Story
                </span>
                <h2 className="text-4xl lg:text-5xl font-display font-extrabold text-brand-dark leading-tight">
                  More than a market, <br />
                  <span className="text-gray-500 font-light">it's a lifestyle.</span>
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed font-normal">
                  Our journey began with a simple mission: to revolutionize how you shop for essentials. We combine the warmth of local service with the efficiency of modern technology.
                </p>
                <p className="text-gray-700 leading-relaxed font-normal">
                  At AMStores, we believe quality shouldn't be a luxury. From fresh produce to pantry staples, every item is hand-picked to ensure it meets our rigorous standards before it reaches your home.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 pt-6">
                  <Link href="/about">
                    <Button size="lg" aria-label="Read Our Story" className="rounded-full px-8 bg-brand-dark hover:bg-black text-white w-full sm:w-auto">Read Our Story</Button>
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-gray-700 font-medium">
                    <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <MapPin size={20} />
                    </div>
                    <p>Ayegoro Junction,<br />Akobo, Ibadan</p>
                  </div>
                </div>
              </div>

              {/* Gallery */}
              <div className="relative h-[500px]">
                <div className="absolute inset-0 bg-brand-primary/5 rounded-[2rem] transform translate-x-4 translate-y-4"></div>
                <Image
                  src="/IMG_E4522.JPG"
                  alt="Our Store"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="relative z-10 object-cover rounded-[2rem] shadow-xl"
                />
                <div className="absolute -bottom-6 -left-6 z-20 bg-white p-6 rounded-2xl shadow-xl max-w-[250px] border border-gray-100 hidden md:block">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="text-brand-primary w-5 h-5" />
                    <span className="font-bold text-gray-900">Need Help?</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Call our customer support for quick orders.</p>
                  <p className="font-bold text-brand-primary text-lg">0802 343 4790</p>
                </div>
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
    <div className="flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group cursor-default">
      <div className="bg-white/10 p-4 rounded-xl shrink-0 group-hover:bg-brand-primary group-hover:scale-110 transition-all duration-300">
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <h4 className="font-bold text-xl mb-2 text-white/90">{title}</h4>
        <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

