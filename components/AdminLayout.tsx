"use client";
import { useState, useEffect, useContext, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading: authLoading, token } = useContext(AuthContext);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setSidebarOpen(window.innerWidth > 1024);
        }
    }, []);

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
                        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
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
                <div className="p-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
                            A
                        </div>
                        <span className="font-display text-2xl font-bold tracking-tight">Admin</span>
                    </Link>
                    <button className="lg:hidden p-2 text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {links.map((link) => {
                        const isActive = pathname === link.path || (link.path !== "/admin" && pathname.startsWith(link.path));
                        return (
                            <Link
                                key={link.name}
                                href={link.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive
                                        ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 font-bold"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                            >
                                <link.icon size={20} />
                                <span className="font-medium">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer"
                    >
                        <LogOut size={20} />
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
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 font-display hidden sm:block">
                            {links.find(l => pathname === l.path || (l.path !== "/admin" && pathname.startsWith(l.path)))?.name || "Dashboard"}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-bold">
                            AD
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto bg-gray-50 p-6 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
