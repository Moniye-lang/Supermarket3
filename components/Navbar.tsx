"use client";

import { useState, useContext, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ShoppingCart,
    Search,
    LogOut,
    Home,
    Store,
    ShoppingBag,
    ClipboardList,
    UserCircle2,
    Menu,
    Info,
    Mail,
} from "lucide-react";
import { CartContext } from "@/context/CartContext";
import { AuthContext } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";

/* ──────────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────────── */
interface MobileBottomNavProps {
    pathname: string;
    totalItems: number;
    user: { name: string; email: string } | null;
    onLogout: () => void;
}

/* ──────────────────────────────────────────────────────────────
   Tab Definitions
────────────────────────────────────────────────────────────── */
const tabs = [
    { name: "Home",    path: "/",         icon: Home,          isAccount: false, isMore: false },
    { name: "Shop",    path: "/products", icon: Store,         isAccount: false, isMore: false },
    { name: "More",    path: "#",         icon: Menu,          isAccount: false, isMore: true  },
    { name: "Orders",  path: "/order",    icon: ClipboardList, isAccount: false, isMore: false },
    { name: "Account", path: "/signin",   icon: UserCircle2,   isAccount: true,  isMore: false },
];

/* ──────────────────────────────────────────────────────────────
   Mobile Bottom Tab Bar
────────────────────────────────────────────────────────────── */
function MobileBottomNav({ pathname, totalItems, user, onLogout }: MobileBottomNavProps) {
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const isActive = (tab: typeof tabs[0]) => {
        if (tab.isMore) {
            return pathname === "/about" || pathname === "/contact";
        }
        if (tab.path === "/") return pathname === "/";
        return pathname.startsWith(tab.path);
    };

    return (
        <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="mx-3 mb-3 rounded-2xl bg-white/85 dark:bg-white/85 backdrop-blur-xl border border-white/60 dark:border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.14)] px-1 py-1 flex items-end justify-around relative">
                {/* ── More Dropdown Menu ── */}
                <AnimatePresence>
                    {showMoreMenu && (
                        <>
                            {/* Backdrop close area */}
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowMoreMenu(false)}
                            />
                            {/* Dropdown Menu */}
                            <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="absolute bottom-[76px] left-1/2 -translate-x-1/2 z-50 w-44 bg-white/95 dark:bg-white/95 backdrop-blur-xl border border-white/60 dark:border-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.12)] rounded-2xl p-2 flex flex-col gap-1"
                            >
                                <Link
                                    href="/about"
                                    onClick={() => setShowMoreMenu(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                        pathname === "/about"
                                            ? "bg-[#AD343E]/10 text-[#AD343E] dark:bg-[#AD343E]/10 dark:text-[#AD343E]"
                                            : "text-gray-700 dark:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-100"
                                    )}
                                >
                                    <Info size={18} className={pathname === "/about" ? "text-[#AD343E] dark:text-[#AD343E]" : "text-gray-500 dark:text-gray-500"} />
                                    <span>About Us</span>
                                </Link>
                                <Link
                                    href="/contact"
                                    onClick={() => setShowMoreMenu(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                        pathname === "/contact"
                                            ? "bg-[#AD343E]/10 text-[#AD343E] dark:bg-[#AD343E]/10 dark:text-[#AD343E]"
                                            : "text-gray-700 dark:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-100"
                                    )}
                                >
                                    <Mail size={18} className={pathname === "/contact" ? "text-[#AD343E] dark:text-[#AD343E]" : "text-gray-500 dark:text-gray-500"} />
                                    <span>Contact Us</span>
                                </Link>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {tabs.map((tab) => {
                    const active = isActive(tab);
                    const Icon = tab.icon;

                    /* ── More Tab ── */
                    if (tab.isMore) {
                        return (
                            <button
                                key={tab.name}
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                                className="flex flex-col items-center py-2 px-3 gap-0.5 min-w-[54px] focus:outline-none relative"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.82 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                >
                                    <Icon
                                        size={24}
                                        className={cn(
                                            "transition-colors duration-200",
                                            active ? "text-[#AD343E]" : "text-gray-400"
                                        )}
                                    />
                                </motion.div>

                                <span className={cn(
                                    "text-[10px] font-semibold transition-colors duration-200",
                                    active ? "text-[#AD343E]" : "text-gray-400"
                                )}>
                                    {tab.name}
                                </span>

                                {active && (
                                    <motion.div
                                        layoutId="tab-dot"
                                        className="w-1 h-1 rounded-full bg-[#AD343E]"
                                    />
                                )}
                            </button>
                        );
                    }

                    /* ── Account Tab ── */
                    if (tab.isAccount) {
                        const href = user ? "#" : "/signin";
                        const handleClick = user
                            ? (e: React.MouseEvent) => { e.preventDefault(); onLogout(); }
                            : undefined;

                        return (
                            <Link
                                key={tab.path}
                                href={href}
                                onClick={handleClick}
                                className="flex flex-col items-center py-2 px-3 gap-0.5 min-w-[54px]"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.82 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    className="relative"
                                >
                                    {user ? (
                                        <div className="w-7 h-7 rounded-full bg-[#AD343E] text-white flex items-center justify-center text-xs font-bold shadow-md">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    ) : (
                                        <Icon
                                            size={24}
                                            className={cn(
                                                "transition-colors duration-200",
                                                active ? "text-[#AD343E]" : "text-gray-400"
                                            )}
                                        />
                                    )}
                                </motion.div>

                                <span className={cn(
                                    "text-[10px] font-semibold transition-colors duration-200 truncate max-w-[52px] text-center",
                                    user || active ? "text-[#AD343E]" : "text-gray-400"
                                )}>
                                    {user ? user.name.split(" ")[0] : "Sign In"}
                                </span>

                                {(active || user) && (
                                    <motion.div
                                        layoutId="tab-dot"
                                        className="w-1 h-1 rounded-full bg-[#AD343E]"
                                    />
                                )}
                            </Link>
                        );
                    }

                    /* ── Regular Tab ── */
                    return (
                        <Link
                            key={tab.path}
                            href={tab.path}
                            className="flex flex-col items-center py-2 px-3 gap-0.5 min-w-[54px]"
                        >
                            <motion.div
                                whileTap={{ scale: 0.82 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                                <Icon
                                    size={24}
                                    className={cn(
                                        "transition-colors duration-200",
                                        active ? "text-[#AD343E]" : "text-gray-400"
                                    )}
                                />
                            </motion.div>

                            <span className={cn(
                                "text-[10px] font-semibold transition-colors duration-200",
                                active ? "text-[#AD343E]" : "text-gray-400"
                            )}>
                                {tab.name}
                            </span>

                            {active && (
                                <motion.div
                                    layoutId="tab-dot"
                                    className="w-1 h-1 rounded-full bg-[#AD343E]"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </motion.nav>
    );
}

/* ──────────────────────────────────────────────────────────────
   Main Navbar
────────────────────────────────────────────────────────────── */
export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const { totalItems } = useContext(CartContext);
    const { user, logout } = useContext(AuthContext);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        
        // Ensure default light mode
        document.documentElement.classList.remove("dark");
        localStorage.removeItem("theme");
        
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        setShowLogoutConfirm(false);
    };

    const navLinks = [
        { name: "Home",     path: "/" },
        { name: "Shop",     path: "/products" },
        { name: "About",    path: "/about" },
        { name: "Checkout", path: "/checkout" },
        { name: "Order",    path: "/order" },
        // { name: "History", path: "/history" },
        { name: "Contact",  path: "/contact" },
    ];

    return (
        <>
            {/* ── Top Header (Desktop + shared logo on mobile) ── */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className={cn(
                    "fixed top-0 left-0 w-full z-50 transition-all duration-300",
                    scrolled ? "py-2" : "py-4"
                )}
            >
                <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
                    <div className={cn(
                        "flex items-center justify-between rounded-2xl px-6 py-3 border transition-all duration-300",
                        scrolled
                            ? "bg-white/70 backdrop-blur-xl border-white/20 shadow-lg"
                            : "bg-transparent border-transparent"
                    )}>
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
                                A
                            </div>
                            <span className="font-display text-2xl font-bold tracking-tight text-brand-dark">
                                AMStores
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className={cn(
                                        "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 hover:bg-white/50",
                                        pathname === link.path
                                            ? "text-brand-primary bg-white/50 font-semibold"
                                            : "text-gray-600 hover:text-brand-primary"
                                    )}
                                >
                                    {link.name}
                                    {pathname === link.path && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-primary rounded-full"
                                        />
                                    )}
                                </Link>
                            ))}
                        </nav>

                        {/* Desktop Actions */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Search */}
                            <button className="p-2 text-gray-600 hover:text-brand-primary hover:bg-white/50 rounded-full transition-all hidden sm:block">
                                <Search size={20} />
                            </button>



                            {/* Cart — visible on both mobile and desktop */}
                            <Link href="/cart" className="relative p-2 hover:bg-white/50 rounded-full transition-all group">
                                <ShoppingCart size={22} className="text-gray-700 group-hover:text-brand-primary transition-colors" />
                                <AnimatePresence>
                                    {totalItems > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white"
                                        >
                                            {totalItems}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>

                            {/* User / Login — desktop only */}
                            {user ? (
                                <div className="hidden md:flex items-center gap-4">
                                    <span className="text-sm font-medium text-brand-dark">
                                        Welcome, <span className="text-brand-primary">{user.name.split(" ")[0]}</span>
                                    </span>
                                    <button
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                        title="Logout"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <Link href="/signin" className="hidden md:block">
                                    <Button variant="primary" size="sm" className="rounded-full px-5 text-xs uppercase tracking-wider">
                                        Sign In
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* ── Mobile Bottom Tab Bar ── */}
            <MobileBottomNav
                pathname={pathname}
                totalItems={totalItems}
                user={user}
                onLogout={() => setShowLogoutConfirm(true)}
            />

            {/* ── Logout Confirmation Modal ── */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutConfirm(false)}
                            className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-white/50"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                <LogOut size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Logout</h3>
                            <p className="text-gray-500 mb-8">Are you sure you want to log out of your account?</p>
                            <div className="flex gap-3">
                                <Button
                                    variant="ghost"
                                    className="flex-1 rounded-xl h-12"
                                    onClick={() => setShowLogoutConfirm(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-1 rounded-xl h-12 bg-red-500 hover:bg-red-600 border-none"
                                    onClick={handleLogout}
                                >
                                    Yes, Logout
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
