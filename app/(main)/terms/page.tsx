"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  CreditCard,
  PackageCheck,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Server,
  ExternalLink,
  Scale,
  Calendar,
  Gavel,
  Mail,
  Globe,
} from "lucide-react";

export default function TermsAndConditionsPage() {
  const sections = [
    {
      number: "1",
      title: "Using Our Platform",
      icon: <ShieldCheck className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            You agree to use <strong className="text-gray-900 dark:text-white">AMStores</strong> lawfully and responsibly.
          </p>
          <p className="font-semibold text-gray-800 dark:text-gray-200 pt-1">You must not:</p>
          <ul className="grid sm:grid-cols-2 gap-2.5 pt-1">
            {[
              "Use the platform for unlawful purposes",
              "Provide false or misleading information",
              "Attempt to gain unauthorised access to another user's account",
              "Interfere with the security or operation of the platform",
              "Use the platform to abuse, harass, or harm others",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 bg-gray-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-gray-100 dark:border-zinc-700/60 text-sm text-gray-700 dark:text-gray-200">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
            We may restrict or suspend access where these Terms are violated.
          </p>
        </div>
      ),
    },
    {
      number: "2",
      title: "User Accounts",
      icon: <CheckCircle2 className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            Some features may require you to create an account.
          </p>
          <p>
            You are responsible for providing accurate information and keeping your account credentials secure.
          </p>
        </div>
      ),
    },
    {
      number: "3",
      title: "Products and Prices",
      icon: <ShoppingBag className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            We aim to provide accurate product descriptions, images, availability information, and prices.
          </p>
          <p>
            However, product information, prices, and stock availability may change without notice.
          </p>
          <p>
            Product images are provided for general representation and may not always exactly reflect the physical product.
          </p>
          <p className="font-medium text-gray-800 dark:text-gray-200">
            We reserve the right to correct errors in product information or pricing.
          </p>
        </div>
      ),
    },
    {
      number: "4",
      title: "Orders",
      icon: <FileText className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            When you place an order, you are submitting a request to purchase the selected products.
          </p>
          <p>
            An order is considered confirmed only after confirmation through the platform or by the relevant store.
          </p>
          <p className="font-semibold text-gray-800 dark:text-gray-200 pt-1">
            We may cancel or decline an order where:
          </p>
          <ul className="space-y-2">
            {[
              "A product is unavailable",
              "There is an obvious pricing or listing error",
              "We are unable to fulfil the order",
              "We suspect fraudulent or unauthorised activity",
              "Circumstances outside our reasonable control prevent fulfilment",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-brand-primary mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
            Where applicable, you will be informed of an order cancellation.
          </p>
        </div>
      ),
    },
    {
      number: "5",
      title: "Payments",
      icon: <CreditCard className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            Available payment methods will be displayed during checkout.
          </p>
          <p>
            You are responsible for providing accurate information required to complete your chosen payment method.
          </p>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 text-emerald-900 dark:text-emerald-200 font-medium">
            🛡️ We do not require or store your bank account number or banking credentials on the platform.
          </div>
        </div>
      ),
    },
    {
      number: "6",
      title: "Pickup",
      icon: <PackageCheck className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 text-brand-primary font-bold">
            📍 All orders placed through the platform are pickup-only unless otherwise stated.
          </div>
          <p>
            The available pickup location and any relevant pickup instructions will be provided during or after the ordering process.
          </p>
          <p>
            You are responsible for collecting your order from the designated pickup location within the applicable pickup period.
          </p>
          <p>
            You may be required to provide your order details or verification information before an order is released.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            We are not responsible for delays or failed pickups resulting from incorrect information provided by the customer or failure to collect an order within the applicable period.
          </p>
        </div>
      ),
    },
    {
      number: "7",
      title: "Cancellations, Returns and Refunds",
      icon: <RefreshCw className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            Cancellation, return, replacement, and refund eligibility may depend on the product, order status, and applicable consumer-protection laws.
          </p>
          <p>
            Any specific return or refund terms presented during purchase will form part of the applicable transaction.
          </p>
          <p>
            Where a refund is approved, the applicable refund method and processing time will be communicated to you.
          </p>
        </div>
      ),
    },
    {
      number: "8",
      title: "User-Submitted Information",
      icon: <MessageSquare className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            If you submit reviews, feedback, requests, comments, or other content, you agree that the information you provide is accurate and does not violate the rights of others.
          </p>
          <p>
            You must not submit unlawful, fraudulent, abusive, defamatory, or misleading content.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            We may remove content that violates these Terms or creates a risk to users or the platform.
          </p>
        </div>
      ),
    },
    {
      number: "9",
      title: "Intellectual Property",
      icon: <Sparkles className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            The platform, including its software, design, branding, graphics, text, logos, and other original materials, is owned by or licensed to <strong className="text-gray-900 dark:text-white">AMStores</strong> unless otherwise stated.
          </p>
          <p>
            You may use the platform for its intended purpose, but you may not copy, reproduce, modify, distribute, reverse engineer, or commercially exploit platform materials without appropriate permission.
          </p>
        </div>
      ),
    },
    {
      number: "10",
      title: "Platform Availability",
      icon: <Server className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            We aim to keep the platform available and functioning properly, but we do not guarantee that it will always be uninterrupted, error-free, or available.
          </p>
          <p>
            We may temporarily suspend or modify the platform for maintenance, security, updates, or other operational reasons.
          </p>
        </div>
      ),
    },
    {
      number: "11",
      title: "Third-Party Services and Links",
      icon: <ExternalLink className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            The platform may contain links or integrations to services operated by third parties.
          </p>
          <p>
            We are not responsible for the content, availability, policies, or practices of third-party services that we do not control.
          </p>
        </div>
      ),
    },
    {
      number: "12",
      title: "Limitation of Liability",
      icon: <Scale className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            To the extent permitted by applicable law, <strong className="text-gray-900 dark:text-white">AMStores</strong> will not be responsible for losses arising from circumstances outside our reasonable control, including service interruptions, inaccurate information supplied by users or sellers, or unauthorised access resulting from circumstances beyond our reasonable control.
          </p>
          <p>
            Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited.
          </p>
        </div>
      ),
    },
    {
      number: "13",
      title: "Changes to These Terms",
      icon: <Calendar className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            We may update these Terms &amp; Conditions when our services, policies, or legal requirements change.
          </p>
          <p>
            Updated Terms will be published on this page with a revised &quot;Last Updated&quot; date.
          </p>
        </div>
      ),
    },
    {
      number: "14",
      title: "Governing Law",
      icon: <Gavel className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            These Terms are governed by the applicable laws of <strong className="text-gray-900 dark:text-white">Oyo State, Nigeria</strong>.
          </p>
          <p>
            Any disputes will be handled in accordance with the applicable laws and courts of the relevant jurisdiction.
          </p>
        </div>
      ),
    },
    {
      number: "15",
      title: "Contact Us",
      icon: <Mail className="text-brand-primary" size={20} />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            If you have questions regarding these Terms &amp; Conditions, please contact us:
          </p>
          <div className="bg-gray-50 dark:bg-zinc-800/80 rounded-2xl p-5 border border-gray-200 dark:border-zinc-700/60 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-gray-900 dark:text-white w-24">Platform:</span>
              <span className="text-gray-700 dark:text-gray-300 font-semibold">AMStores</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-gray-900 dark:text-white w-24 flex items-center gap-1.5">
                <Mail size={16} className="text-brand-primary" /> Email:
              </span>
              <a href="mailto:davidadeniyi269@gmail.com" className="text-brand-primary hover:underline font-semibold">
                davidadeniyi269@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-gray-900 dark:text-white w-24 flex items-center gap-1.5">
                <Globe size={16} className="text-brand-primary" /> Website:
              </span>
              <a href="https://agbenimercantilestores.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-semibold">
                agbenimercantilestores.com
              </a>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-brand-light dark:bg-zinc-950 pt-28 pb-20">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        
        {/* Back navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-primary dark:hover:text-red-400 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-10 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-zinc-800 mb-10"
        >
          <div className="flex items-center gap-3 text-brand-primary mb-4">
            <FileText size={28} />
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">
              Legal &amp; Service Agreement
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
            Terms &amp; Conditions
          </h1>
          
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <Clock size={14} />
            <span>Last Updated: 23/09/2026</span>
          </div>

          <p className="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Welcome to <strong className="text-gray-900 dark:text-white">AMStores</strong>. By accessing or using our website or application, you agree to these Terms &amp; Conditions.
          </p>
        </motion.div>

        {/* Main Content Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.section
              key={section.number}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.02 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3 mb-5 border-b border-gray-100 dark:border-zinc-800 pb-4">
                <span className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center shrink-0">
                  {section.number}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-display">
                  {section.title}
                </h2>
              </div>
              <div>{section.content}</div>
            </motion.section>
          ))}
        </div>

      </div>
    </div>
  );
}
