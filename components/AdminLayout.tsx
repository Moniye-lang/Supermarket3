"use client";
import { useState, useEffect, useContext, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut,
    Menu, X, Webhook, Smartphone, Share, PlusSquare, CheckCircle, ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading: authLoading, token } = useContext(AuthContext);

    // PWA & Add to Home Screen state
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [showIosModal, setShowIosModal] = useState(false);

    // Set initial sidebar state based on screen size
    useEffect(() => {
        if (typeof window !== "undefined") {
            setSidebarOpen(window.innerWidth > 1024);

            // Detect standalone PWA mode
            const standalone =
                ("standalone" in window.navigator && (window.navigator as any).standalone) ||
                window.matchMedia("(display-mode: standalone)").matches;
            setIsStandalone(standalone);

            // Detect iOS Safari
            const ua = window.navigator.userAgent || "";
            const ios =
                /iPad|iPhone|iPod/.test(ua) ||
                (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
            setIsIos(ios);

            // Capture beforeinstallprompt for Android / Chrome / Edge
            const handleBeforeInstall = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e);
            };
            window.addEventListener("beforeinstallprompt", handleBeforeInstall);

            return () => {
                window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
            };
        }
    }, []);

    // Requirement 2: Auto-close sidebar on mobile whenever the route / pathname changes
    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    }, [pathname]);

    // Role-based auth guard
    useEffect(() => {
        if (!authLoading) {
            if (!token && !localStorage.getItem("token")) {
                router.push("/admin/login");
            } else if (user && user.role !== "admin") {
                router.push("/admin/login");
            }
        }
    }, [token, user, authLoading, router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/admin/login");
    };

    const closeMobileSidebar = () => {
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    // Requirement 1: Trigger Add to Home Screen
    const handleInstallAdmin = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setIsStandalone(true);
            }
            setDeferredPrompt(null);
        } else if (isIos && !isStandalone) {
            setShowIosModal(true);
        } else {
            // General guidance for browsers
            alert("To add AMStores Admin to your home screen:\n\n1. Open your browser menu (three dots or share button)\n2. Tap 'Add to Home Screen' or 'Install App'.");
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return null;
    }

    const links = [
        { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
        { name: "Products", path: "/admin/products", icon: Package },
        { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
        { name: "Users", path: "/admin/users", icon: Users },
        { name: "Integrations", path: "/admin/integrations", icon: Webhook },
        { name: "Settings", path: "/admin/settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -280 }}
                animate={{ x: sidebarOpen ? 0 : -280 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed lg:sticky top-0 left-0 h-screen w-[280px] bg-brand-dark text-white z-50 flex flex-col shadow-2xl lg:shadow-none"
            >
                {/* Brand / Logo */}
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                    <Link href="/admin" onClick={closeMobileSidebar} className="flex items-center gap-2 group">
                        <div className="relative h-10 w-36 flex items-center bg-white/95 rounded-xl px-2 py-0.5 shadow-sm group-hover:scale-105 transition-transform">
                            <Image
                                src="/logo.png"
                                alt="AMStores"
                                fill
                                sizes="144px"
                                className="object-contain p-0.5"
                            />
                        </div>
                        <span className="bg-brand-primary text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">Admin</span>
                    </Link>
                    <button className="lg:hidden p-2 text-gray-400 hover:text-white cursor-pointer" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {links.map((link) => {
                        const isActive = pathname === link.path || (link.path !== "/admin" && pathname.startsWith(link.path));
                        return (
                            <Link
                                key={link.name}
                                href={link.path}
                                onClick={closeMobileSidebar}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive
                                        ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 font-bold"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                            >
                                <link.icon size={20} />
                                <span className="font-medium text-sm">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Add Admin to Home Screen Box (PWA) */}
                <div className="p-4 border-t border-white/10 space-y-2">
                    {!isStandalone ? (
                        <button
                            type="button"
                            onClick={handleInstallAdmin}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-brand-primary/20 to-amber-500/10 border border-brand-primary/30 text-white text-xs font-bold hover:bg-brand-primary/30 transition-all cursor-pointer shadow-sm group"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center text-white shrink-0">
                                    <Smartphone size={15} />
                                </div>
                                <div className="text-left">
                                    <p className="leading-tight font-extrabold">Add to Home Screen</p>
                                    <p className="text-[10px] text-gray-300 font-normal">Install Admin App</p>
                                </div>
                            </div>
                            <ArrowUpRight size={14} className="text-brand-primary group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                            <CheckCircle size={14} />
                            <span>Admin App Installed</span>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer text-sm"
                    >
                        <LogOut size={18} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors lg:hidden cursor-pointer"
                            aria-label="Toggle Menu"
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 font-display hidden sm:block">
                            {links.find(l => pathname === l.path || (l.path !== "/admin" && pathname.startsWith(l.path)))?.name || "Dashboard"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Mobile Add to Home Screen Button in Header */}
                        {!isStandalone && (
                            <button
                                type="button"
                                onClick={handleInstallAdmin}
                                className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-xl text-xs font-bold border border-brand-primary/20 active:scale-95 transition-all cursor-pointer"
                                title="Add Admin to Home Screen"
                            >
                                <Smartphone size={14} />
                                <span>Install App</span>
                            </button>
                        )}

                        <div className="flex items-center gap-2 bg-gray-50 py-1.5 px-3 rounded-full border border-gray-100">
                            <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-bold text-xs">
                                AD
                            </div>
                            <span className="text-xs font-bold text-gray-700 hidden sm:inline">{user.name || "Administrator"}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {/* iOS Add to Home Screen Modal Guide */}
            <AnimatePresence>
                {showIosModal && (
                    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-zinc-800 text-center space-y-4"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
                                <Smartphone size={28} />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Admin to Home Screen</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                    Install AMStores Admin as a dedicated full-screen app on your iPhone or iPad:
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-2xl space-y-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                    <span className="flex items-center gap-1.5">Tap the Safari <Share size={15} className="text-blue-500" /> Share button below</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                    <span className="flex items-center gap-1.5">Scroll down and tap <PlusSquare size={15} /> <strong>Add to Home Screen</strong></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                    <span>Tap <strong>Add</strong> in the top-right corner</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowIosModal(false)}
                                className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                            >
                                Got It!
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
