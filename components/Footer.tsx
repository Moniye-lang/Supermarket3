"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaGithub } from "react-icons/fa";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

const fdata = [
    {
        id: 1,
        img: '/IMG_4525.JPG'
    },
    {
        id: 2,
        img: '/IMG_4534.JPG'
    },
    {
        id: 3,
        img: '/IMG_4530.JPG'
    },
    {
        id: 4,
        img: '/IMG_4527.JPG'
    }
];

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white pt-24 pb-12 border-t border-white/5 relative overflow-hidden">
      {/* Background pattern/glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">

          {/* Brand & Newsletter */}
          <div className="lg:col-span-4 space-y-8">
            <Link href="/" className="flex items-center group w-fit">
              <div className="relative h-12 sm:h-14 w-44 sm:w-52 flex items-center bg-white/95 rounded-2xl px-3 py-1 shadow-lg group-hover:scale-105 transition-transform duration-200">
                <Image
                  src="/logo.png"
                  alt="AMStores - Agbeni Mercantile Stores"
                  fill
                  sizes="208px"
                  className="object-contain p-1"
                />
              </div>
            </Link>
            <p className="text-gray-400 leading-relaxed text-base max-w-sm">
              Experience the future of grocery shopping. Premium products, delivered with care and precision directly to your doorstep.
            </p>

            <div className="space-y-3">
              <h5 className="font-medium text-white/90">Subscribe to our newsletter</h5>
              <div className="flex gap-2 max-w-sm">
                <Input
                  placeholder="Email address"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-brand-primary/50"
                />
                <Button size="icon" className="shrink-0 rounded-lg">
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="font-display text-lg font-semibold mb-6 text-white">Explore</h4>
            <ul className="space-y-4">
              {[
                { name: "Home", path: "/" },
                { name: "About Us", path: "/about" },
                { name: "Shop Products", path: "/products" },
                { name: "Contact Us", path: "/contact" },
              ].map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-gray-400 hover:text-brand-primary transition-colors hover:pl-1 block text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-3">
            <h4 className="font-display text-lg font-semibold mb-6 text-white">Contact</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-4 text-gray-400 text-sm group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-primary/20 transition-colors">
                  <MapPin size={18} className="text-brand-primary" />
                </div>
                <span className="mt-1 leading-relaxed">Ayegoro Junction,<br />Kolapo Ishola Estate,<br />Akobo, Ibadan</span>
              </li>
              <li className="flex items-center gap-4 text-gray-400 text-sm group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-primary/20 transition-colors">
                  <Phone size={18} className="text-brand-primary" />
                </div>
                <span className="group-hover:text-white transition-colors">08023434790</span>
              </li>
              <li className="flex items-center gap-4 text-gray-400 text-sm group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-primary/20 transition-colors">
                  <Mail size={18} className="text-brand-primary" />
                </div>
                <span className="group-hover:text-white transition-colors">amstores@gmail.com</span>
              </li>
            </ul>
          </div>

            {/* Socials / Gallery Preview */}
          <div className="lg:col-span-3">
            <h4 className="font-display text-lg font-semibold mb-6 text-white">Follow Us</h4>
            <div className="flex gap-3 mb-8">
              {[
                { icon: <FaTwitter size={18} key="tw" />, label: "Twitter" }, 
                { icon: <FaFacebookF size={18} key="fb" />, label: "Facebook" }, 
                { icon: <FaInstagram size={18} key="ig" />, label: "Instagram" }, 
                { icon: <FaGithub size={18} key="gh" />, label: "Github" }
              ].map((item, i) => (
                <a key={i} href="#" aria-label={item.label} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-brand-primary hover:text-white flex items-center justify-center text-gray-300 transition-all hover:-translate-y-1">
                  {item.icon}
                </a>
              ))}
            </div>

            {/* Mini Gallery */}
            <div className="grid grid-cols-3 gap-2">
              {fdata && fdata.slice(0, 3).map((item, i) => (
                <div key={item.id || i} className="relative aspect-square rounded-md overflow-hidden group cursor-pointer">
                  <Image src={item.img} alt="Gallery" fill sizes="100px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
            <span>&copy; {new Date().getFullYear()} AMStores</span>
            <span>&middot;</span>
            <Link href="/privacy" className="hover:text-brand-primary text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <span>&middot;</span>
            <Link href="/terms" className="hover:text-brand-primary text-gray-300 transition-colors">
              Terms &amp; Conditions
            </Link>
            <span>&middot;</span>
            <Link href="/contact" className="hover:text-brand-primary text-gray-300 transition-colors">
              Contact
            </Link>
          </p>
          <div className="flex gap-6 text-xs text-gray-500">
            <span>Fresh Groceries Delivered Fast</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

