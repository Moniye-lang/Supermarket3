import { useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Users, ShoppingBag, Truck, Star, CheckCircle } from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";

export default function About() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const stats = [
    { num: "8+", label: "Years of Excellence", icon: Award },
    { num: "10K+", label: "Happy Customers", icon: Users },
    { num: "1K+", label: "Premium Products", icon: ShoppingBag },
    { num: "3", label: "Specialized Hubs", icon: Truck },
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
    },
    {
      name: "Grace O.",
      role: "Foodie",
      text: "I love their bakery section. Always fresh bread and pastries. Customer service is top-notch!",
    },
    {
      name: "Chinedu U.",
      role: "Regular Shopper",
      text: "Shopping here is always convenient. I find almost everything I need at good prices.",
    },
  ];

  return (
    <div className="min-h-screen bg-brand-light">

      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block py-1 px-3 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-bold tracking-wider uppercase mb-6"
          >
            Since 2016
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold text-brand-dark mb-8 leading-tight"
          >
            We are <span className="text-brand-primary">Agbeni</span> Supermarket
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto"
          >
            From a small local store to one of the most trusted names in quality groceries.
            Our mission is simple — to provide fresh, affordable, and reliable products with top-tier service.
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 bg-white border-y border-gray-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-primary">
                  <stat.icon size={24} />
                </div>
                <h3 className="text-3xl font-bold text-brand-dark mb-1">{stat.num}</h3>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-24 space-y-24 lg:space-y-32">
        {features.map((feature, idx) => (
          <div key={idx} className="container mx-auto px-6">
            <div className={`flex flex-col ${feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}>
              {/* Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-full lg:w-1/2 relative group"
              >
                <div className={`absolute inset-0 bg-brand-primary/10 rounded-[2rem] transform ${feature.reverse ? 'rotate-3 group-hover:rotate-6' : '-rotate-3 group-hover:-rotate-6'} transition-transform duration-500`} />
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="relative w-full h-[400px] lg:h-[500px] object-cover rounded-[2rem] shadow-xl z-10"
                />
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: feature.reverse ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="w-full lg:w-1/2 space-y-6"
              >
                <div className="flex items-center gap-3">
                  <span className="w-12 h-1 bg-brand-primary rounded-full" />
                  <span className="text-brand-primary font-bold tracking-wider uppercase text-sm">{feature.subtitle}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-brand-dark">{feature.title}</h2>
                <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
                <ul className="space-y-3 pt-4">
                  {["Quality Guaranteed", "Best Prices", "Excellent Service"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                      <CheckCircle size={20} className="text-green-500" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        ))}
      </section>

      {/* Reviews */}
      <section className="py-24 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">Loved by Our Commmunity</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Don't just take our word for it. Here's what our customers have to say about their experience.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((review, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md h-full hover:bg-white/10 transition-colors">
                  <CardContent className="p-8">
                    <div className="flex gap-1 text-yellow-500 mb-6">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="currentColor" />)}
                    </div>
                    <p className="text-white/80 italic mb-6 leading-relaxed">"{review.text}"</p>
                    <div>
                      <h4 className="font-bold text-white text-lg">{review.name}</h4>
                      <p className="text-white/40 text-sm">{review.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

