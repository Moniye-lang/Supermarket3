import Hero from "../components/Hero";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ShoppingCart, Beef, Donut, Phone, Mail, MapPin, Clock, Tag, Truck, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
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
  ];

  return (
    <div className="bg-brand-light w-full overflow-hidden">
      <Hero />

      {/* CATEGORIES SECTION */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-brand-primary font-semibold tracking-wider text-sm uppercase">What We Offer</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-brand-dark mt-3 mb-6">Browse Categories</h2>
            <p className="text-gray-600 text-lg">Explore our wide range of premium products, carefully curated for your daily needs.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <Card className="h-full border-none shadow-xl shadow-brand-dark/5 hover:shadow-2xl">
                  <CardContent className="p-8 flex flex-col items-center text-center h-full">
                    <div className={`w-20 h-20 ${item.bg} ${item.color} rounded-full flex items-center justify-center mb-6`}>
                      <item.Icon size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-brand-dark mb-4">{item.label}</h3>
                    <p className="text-gray-500 mb-8 flex-grow">{item.description}</p>
                    <Link to="/Products">
                      <Button variant="ghost" className="group text-brand-primary hover:bg-brand-primary/5">
                        Explore <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT / STORY SECTION */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Gallery / Image Stack */}
            <div className="relative">
              <div className="absolute -inset-4 bg-brand-primary/5 rounded-[3rem] -rotate-6 z-0" />
              <img
                src="/IMG_E4522.JPG"
                alt="Our Store"
                className="relative z-10 w-full rounded-[2rem] shadow-2xl"
              />

              {/* Floating Contact Card */}
              <div className="absolute -bottom-10 -right-10 z-20 bg-white p-6 rounded-2xl shadow-xl max-w-xs hidden md:block border border-gray-100">
                <h4 className="font-bold text-brand-dark mb-4">Visit Us Today</h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-brand-primary shrink-0 w-4 h-4 mt-1" />
                    <span>Ayegoro Junction, Kolapo Ishola Estate, Akobo, Ibadan</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-brand-primary shrink-0 w-4 h-4" />
                    <span>08023434790</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <span className="text-brand-primary font-semibold tracking-wider text-sm uppercase">Our Story</span>
              <h2 className="text-4xl lg:text-5xl font-display font-bold text-brand-dark leading-tight">
                More than just a market, <br />
                <span className="text-gray-400">it's a lifestyle.</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our journey began with a simple mission: to revolutionize how you shop for essentials. We combine the warmth of local service with the efficiency of modern technology.
              </p>
              <p className="text-gray-600 leading-relaxed">
                At AMStores, we believe quality shouldn't be a luxury. From fresh produce to pantry staples, every item is hand-picked to ensure it meets our rigorous standards before it reaches your home.
              </p>
              <div className="pt-4">
                <Link to="/About">
                  <Button variant="outline" size="lg" className="rounded-full">Read More About Us</Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURES / DELIVERY */}
      <section className="py-24 bg-brand-dark text-white relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-6xl font-display font-bold leading-tight">
              Premium Delivery <br />
              <span className="text-brand-primary">Straight to You.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-md">
              We've optimized every step of the process to ensure your order arrives fresh, fast, and exactly as you expected.
            </p>

            <div className="space-y-6">
              <FeatureItem
                icon={Clock}
                title="30-Minute Delivery"
                desc="Lightning fast delivery within Ibadan metropolis."
              />
              <FeatureItem
                icon={Tag}
                title="Best Market Prices"
                desc="Competitive pricing without compromising on quality."
              />
              <FeatureItem
                icon={Truck}
                title="Real-time Tracking"
                desc="Know exactly where your order is at every moment."
              />
            </div>
          </div>

          <div className="relative h-[500px] lg:h-[600px] flex items-center justify-center">
            <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl" />
            <div className="grid gap-6 grid-cols-2">
              <div className="space-y-6 mt-12">
                <img src="/IMG_4531.JPG" className="rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500 opacity-90 hover:opacity-100" />
                <img src="/IMG_4525.JPG" className="rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500 opacity-90 hover:opacity-100" />
              </div>
              <div className="space-y-6">
                <img src="/IMG_4542.JPG" className="rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500 opacity-90 hover:opacity-100 h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="bg-brand-primary p-3 rounded-full shrink-0">
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <h4 className="font-bold text-lg mb-1">{title}</h4>
        <p className="text-gray-400 text-sm">{desc}</p>
      </div>
    </div>
  );
}

