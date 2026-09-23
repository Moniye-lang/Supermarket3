"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2, Mail, Globe, ArrowLeft, Clock } from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      id: "section-1",
      number: "1",
      title: "Information We Collect",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            When you use our platform, we may collect information such as:
          </p>
          <ul className="grid sm:grid-cols-2 gap-2.5 pt-1">
            {[
              "Your name",
              "Email address",
              "Phone number, where required",
              "Delivery or pickup information",
              "Shopping preferences",
              "Saved products, favourites, or cart information",
              "Order information",
              "Information you voluntarily provide when contacting us or submitting a request",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 bg-gray-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-gray-100 dark:border-zinc-700/60 text-sm text-gray-700 dark:text-gray-200">
                <CheckCircle2 size={16} className="text-brand-primary mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
            We only collect information that is reasonably necessary to provide and improve our services.
          </p>
        </div>
      ),
    },
    {
      id: "section-2",
      number: "2",
      title: "Information We Do Not Collect",
      content: (
        <div className="space-y-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <EyeOff className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" size={20} />
              <div className="space-y-2 text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
                <p>
                  <strong>We do not require or collect</strong> your bank account number or banking credentials.
                </p>
                <p>
                  <strong>We do not use IP addresses</strong> to track or profile your activity for advertising or behavioural purposes.
                </p>
                <p>
                  <strong>We do not intentionally collect</strong> sensitive personal information unless it is necessary for a specific service and permitted by applicable law.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "section-3",
      number: "3",
      title: "How We Use Your Information",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            We may use your information to:
          </p>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {[
              "Provide and improve your shopping experience",
              "Process and manage orders",
              "Provide delivery or pickup services",
              "Remember your preferences and saved items",
              "Help you find products and services that may be relevant to you",
              "Respond to questions, requests, and customer-support enquiries",
              "Maintain and improve the security and functionality of the platform",
              "Communicate with you about your account, orders, or important service updates",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-brand-primary mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="p-3.5 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-xl border border-brand-primary/15 text-sm font-semibold text-brand-primary">
            🛡️ We do not sell your personal information.
          </div>
        </div>
      ),
    },
    {
      id: "section-4",
      number: "4",
      title: "Payments",
      content: (
        <div className="space-y-3 text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
          <p>
            Where payments are available, we do not request or store your bank account number or banking credentials on our platform.
          </p>
          <p>
            Any payment information requested during a transaction will only be used for the purpose for which it is provided.
          </p>
        </div>
      ),
    },
    {
      id: "section-5",
      number: "5",
      title: "Cookies and Similar Technologies",
      content: (
        <div className="space-y-3 text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
          <p>
            We may use essential cookies or similar technologies required for the website or application to function properly, such as maintaining your session or remembering preferences.
          </p>
          <p>
            Where additional tracking technologies are introduced, we will update this Privacy Policy and provide any notices or choices required by applicable law.
          </p>
        </div>
      ),
    },
    {
      id: "section-6",
      number: "6",
      title: "Sharing of Information",
      content: (
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-900 dark:text-white">We do not sell your personal information.</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">We may disclose information where reasonably necessary to:</p>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {[
              "Provide a service you have requested",
              "Complete or fulfil an order",
              "Comply with a legal obligation",
              "Protect the security, rights, or property of our platform, users, or others",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-brand-primary mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Where third-party service providers are used to operate parts of the platform, they may process information only as necessary to provide their services.
          </p>
        </div>
      ),
    },
    {
      id: "section-7",
      number: "7",
      title: "Data Security",
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            We take reasonable technical and organisational measures to protect your information against unauthorised access, alteration, disclosure, or destruction.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            However, no online service can guarantee absolute security.
          </p>
        </div>
      ),
    },
    {
      id: "section-8",
      number: "8",
      title: "How Long We Keep Your Information",
      content: (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            We retain personal information only for as long as reasonably necessary for the purposes described in this Policy, to provide our services, resolve disputes, maintain appropriate records, or comply with legal obligations.
          </p>
          <p>
            When information is no longer required, we may delete or anonymise it.
          </p>
        </div>
      ),
    },
    {
      id: "section-9",
      number: "9",
      title: "Your Rights",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Depending on applicable law, you may have the right to:</p>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {[
              "Request access to information we hold about you",
              "Request correction of inaccurate information",
              "Request deletion of your personal information",
              "Withdraw consent where processing is based on consent",
              "Ask questions about how your information is being used",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-brand-primary mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            To make a privacy-related request, contact us using the details below.
          </p>
        </div>
      ),
    },
    {
      id: "section-10",
      number: "10",
      title: "Children's Privacy",
      content: (
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          Our services are not intended to knowingly collect personal information from children in circumstances where parental consent is required by applicable law.
        </p>
      ),
    },
    {
      id: "section-11",
      number: "11",
      title: "Changes to This Privacy Policy",
      content: (
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            We may update this Privacy Policy from time to time to reflect changes to our services, technology, or legal requirements.
          </p>
          <p>
            When significant changes are made, we will provide an appropriate notice through the platform where required.
          </p>
        </div>
      ),
    },
    {
      id: "section-12",
      number: "12",
      title: "Contact Us",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            If you have questions about this Privacy Policy or how your information is handled, please contact us:
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
            <ShieldCheck size={28} />
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">
              Legal &amp; Data Protection
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <Clock size={14} />
            <span>Last Updated: 23/09/2026</span>
          </div>

          <p className="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            We respect your privacy and are committed to protecting the information you provide when using <strong className="text-gray-900 dark:text-white">AMStores</strong>. This Privacy Policy explains what information we collect, why we collect it, and how we use and protect it.
          </p>
        </motion.div>

        {/* Main Content Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
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
