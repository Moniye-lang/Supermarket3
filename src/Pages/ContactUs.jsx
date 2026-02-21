import { useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function ContactUs() {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
        <div className="min-h-screen bg-brand-light pt-24 pb-20">
            <div className="container mx-auto px-6 max-w-7xl">

                {/* Header */}
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-display font-bold text-brand-dark mb-6"
                    >
                        Get in <span className="text-brand-primary">Touch</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-600 leading-relaxed"
                    >
                        Have a question or feedback? We'd love to hear from you. Visit us in store or send us a message below.
                    </motion.p>
                </div>

                <div className="grid lg:grid-cols-3 gap-12 lg:gap-20">

                    {/* Contact Info Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-8"
                    >
                        {/* Info Cards */}
                        <div className="grid gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className="bg-brand-primary/10 p-3 rounded-full text-brand-primary">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-dark text-lg mb-1">Our Location</h3>
                                    <p className="text-gray-600">General Gas Road, Akobo,<br />Ibadan, Oyo State</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className="bg-brand-primary/10 p-3 rounded-full text-brand-primary">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-dark text-lg mb-1">Phone Number</h3>
                                    <p className="text-gray-600">+234 812 345 6789<br />+234 809 876 5432</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className="bg-brand-primary/10 p-3 rounded-full text-brand-primary">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-dark text-lg mb-1">Email Address</h3>
                                    <p className="text-gray-600">hello@amstores.com<br />support@amstores.com</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className="bg-brand-primary/10 p-3 rounded-full text-brand-primary">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-dark text-lg mb-1">Working Hours</h3>
                                    <p className="text-gray-600">Mon - Sat: 8:00 AM - 9:00 PM<br />Sun: 10:00 AM - 7:00 PM</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Form Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-2"
                    >
                        <form className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100">
                            <h2 className="text-2xl font-bold text-brand-dark mb-8">Send us a Message</h2>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Your Name</label>
                                    <Input placeholder="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                    <Input type="email" placeholder="john@example.com" />
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-medium text-gray-700">Subject</label>
                                <Input placeholder="How can we help?" />
                            </div>

                            <div className="space-y-2 mb-8">
                                <label className="text-sm font-medium text-gray-700">Message</label>
                                <textarea
                                    className="w-full min-h-[150px] p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none bg-gray-50/50"
                                    placeholder="Tell us more about your inquiry..."
                                />
                            </div>

                            <Button className="w-full md:w-auto px-10 py-4 text-base shadow-lg shadow-brand-primary/20">
                                Send Message <Send size={18} className="ml-2" />
                            </Button>
                        </form>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}


