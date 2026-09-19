"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView, animate } from "framer-motion";
import { Award, Users, ShoppingBag, Store, Star, CheckCircle, ChevronLeft, ChevronRight, Quote } from "lucide-react";

function CountUpNumber({ value, duration = 2, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView && ref.current) {
      const controls = animate(0, value, {
        duration,
        ease: "easeOut",
        onUpdate(v) {
          if (ref.current) {
            ref.current.textContent = Math.floor(v) + suffix;
          }
        }
      });
      return () => controls.stop();
    }
  }, [isInView, value, duration, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

export default function About() {
  const [activeReview, setActiveReview] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const stats = [
    { num: 8, suffix: "+", label: "Years of Excellence", icon: Award },
    { num: 10, suffix: "K+", label: "Happy Customers", icon: Users },
    { num: 1, suffix: "K+", label: "Premium Products", icon: ShoppingBag },
    { num: 3, suffix: "", label: "Specialized Hubs", icon: Store },
  ];

  const features = [
    {
      title: "The Supermarket",
      subtitle: "Everything You Need",
      description: "Our main supermarket offers everything from daily essentials to luxury items. With wide aisles, clean spaces, and attentive staff, shopping here is always a pleasure.",
      image: "/AMstore1.jpg",
      reverse: false,
    },
    {
      title: "The Bakery",
      subtitle: "Freshly Baked Daily",
      description: "Our bakery is where the aroma of freshly baked bread fills the air. From soft pastries to crispy rolls, we use only quality ingredients to ensure every bite is perfection.",
      image: "/IMG_4524.JPG",
      reverse: true,
    },
    {
      title: "Frozen Hub",
      subtitle: "Quality Preserved",
      description: "Our Frozen Hub is your reliable source for frozen food — poultry, seafood, and snacks — stored under optimal conditions for freshness and safety.",
      image: "/IMG_4523.JPG",
      reverse: false,
    },
  ];

  const reviews = [
    {
      name: "Adewale Johnson",
      role: "Loyal Customer",
      text: "Agbeni Supermarket is my go-to store at General Gas Road. Their prices are fair and the variety is excellent.",
      initials: "AJ",
      color: "bg-blue-500"
    },
    {
      name: "Grace O.",
      role: "Foodie",
      text: "I love their bakery section. Always fresh bread and pastries. Customer service is top-notch!",
      initials: "GO",
      color: "bg-green-500"
    },
    {
      name: "Chinedu U.",
      role: "Regular Shopper",
      text: "Shopping here is always convenient. I find almost everything I need at good prices.",
      initials: "CU",
      color: "bg-orange-500"
    },
  ];

  return (
    <div className="min-h-screen bg-brand-light overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-44 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-brand-primary/5 rounded-full blur-[80px] sm:blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-brand-secondary/5 rounded-full blur-[60px] sm:blur-[80px] translate-y-1/2 -translate-x-1/4" />

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block py-1 px-3.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs sm:text-sm font-bold tracking-wider uppercase mb-4 sm:mb-6"
          >
            Since 2016
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-brand-dark mb-6 sm:mb-8 leading-tight sm:leading-tight"
          >
            We are <span className="text-brand-primary">Agbeni</span> Supermarket
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto px-2"
          >
            From a small local store to one of the most trusted names in quality groceries.
            Our mission is simple — to provide fresh, affordable, and reliable products with top-tier service.
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center p-2 sm:p-4"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-brand-primary">
                  <stat.icon size={20} className="sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-1">
                  <CountUpNumber value={stat.num} suffix={stat.suffix} duration={2 + (idx * 0.2)} />
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-16 sm:py-24 space-y-16 sm:space-y-24 lg:space-y-32">
        {features.map((feature, idx) => (
          <div key={idx} className="container mx-auto px-4 sm:px-6">
            <div className={`flex flex-col ${feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 sm:gap-12 lg:gap-20`}>
              {/* Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-full lg:w-1/2 relative group"
              >
                <div className={`absolute inset-0 bg-brand-primary/10 rounded-3xl sm:rounded-[2rem] transform ${feature.reverse ? 'rotate-2 sm:rotate-3 group-hover:rotate-4 sm:group-hover:rotate-6' : '-rotate-2 sm:-rotate-3 group-hover:-rotate-4 sm:group-hover:-rotate-6'} transition-transform duration-500`} />
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="relative w-full h-[240px] sm:h-[360px] md:h-[420px] lg:h-[480px] object-cover rounded-3xl sm:rounded-[2rem] shadow-xl z-10"
                />
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: feature.reverse ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="w-full lg:w-1/2 space-y-4 sm:space-y-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 sm:w-12 h-1 bg-brand-primary rounded-full" />
                  <span className="text-brand-primary font-bold tracking-wider uppercase text-xs sm:text-sm">{feature.subtitle}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-brand-dark">{feature.title}</h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2.5 sm:space-y-3 pt-2 sm:pt-4">
                  {["Quality Guaranteed", "Best In-Store Prices", "Fast Pickup Service"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 sm:gap-3 text-sm sm:text-base text-gray-700 font-medium">
                      <CheckCircle size={18} className="text-green-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        ))}
      </section>

      {/* Reviews Section */}
      <section className="py-16 sm:py-28 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8 sm:gap-16 items-center">

            <div className="lg:w-1/3 space-y-4 sm:space-y-6 w-full text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-3 justify-center lg:justify-start">
                  <span className="w-8 sm:w-12 h-1 bg-brand-primary rounded-full" />
                  <span className="text-brand-primary font-bold tracking-wider uppercase text-xs sm:text-sm">Testimonials</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-gray-900 leading-tight">
                  What Our <span className="text-brand-primary">Community</span> Says
                </h2>
                <p className="text-gray-500 mt-4 text-sm sm:text-base">
                  Discover why thousands of families in Ibadan trust AMStores for fresh groceries and items daily.
                </p>

                <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-10 justify-center lg:justify-start">
                  <button
                    onClick={() => setActiveReview((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm cursor-pointer"
                    aria-label="Previous review"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActiveReview((prev) => (prev === reviews.length - 1 ? 0 : prev + 1))}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm cursor-pointer"
                    aria-label="Next review"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            </div>

            <div className="lg:w-2/3 w-full">
              <div className="relative min-h-[300px] sm:min-h-[360px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeReview}
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-xl sm:shadow-2xl shadow-gray-200/50 p-6 sm:p-10 md:p-12 border border-gray-100 relative"
                  >
                    <Quote className="text-brand-primary/15 absolute top-6 left-6 sm:top-10 sm:left-10" size={40} />

                    <div className="relative z-10 pl-2 sm:pl-8 pt-2 sm:pt-4">
                      <div className="flex gap-1 text-yellow-500 mb-4 sm:mb-6">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={18} fill="currentColor" />)}
                      </div>

                      <p className="text-lg sm:text-2xl md:text-3xl text-gray-800 font-display leading-snug mb-8 sm:mb-10 italic">
                        &ldquo;{reviews[activeReview].text}&rdquo;
                      </p>

                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${reviews[activeReview].color} flex items-center justify-center text-white font-bold text-lg sm:text-2xl shadow-inner shrink-0`}>
                          {reviews[activeReview].initials}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base sm:text-xl">{reviews[activeReview].name}</h4>
                          <p className="text-brand-primary text-xs sm:text-sm font-medium">{reviews[activeReview].role}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center gap-2.5 mt-6">
                  {reviews.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveReview(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        activeReview === idx ? "w-8 bg-brand-primary" : "w-2.5 bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
