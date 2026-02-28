import { useState, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, User, Search, LogOut } from "lucide-react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils/cn";
import { Button } from "./ui/Button";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { totalItems } = useContext(CartContext);
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => setIsOpen(false), [location]);

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Shop", path: "/products" },
        { name: "About", path: "/about" },
        { name: "Contact", path: "/contact" },
    ];

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className={cn(
                    "fixed top-0 left-0 w-full z-50 transition-all duration-300",
                    scrolled ? "py-2" : "py-4"
                )}
            >
                <div className={cn(
                    "container mx-auto px-4 sm:px-6 transition-all duration-300",
                    scrolled ? "max-w-7xl" : "max-w-7xl"
                )}>
                    <div className={cn(
                        "flex items-center justify-between rounded-2xl px-6 py-3 border transition-all duration-300",
                        scrolled
                            ? "bg-white/70 backdrop-blur-xl border-white/20 shadow-lg"
                            : "bg-transparent border-transparent"
                    )}>
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
                                A
                            </div>
                            <span className={cn(
                                "font-display text-2xl font-bold tracking-tight transition-colors",
                                scrolled ? "text-brand-dark" : "text-brand-dark"
                            )}>
                                AMStores
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 hover:bg-white/50",
                                        location.pathname === link.path
                                            ? "text-brand-primary bg-white/50 font-semibold"
                                            : "text-gray-600 hover:text-brand-primary"
                                    )}
                                >
                                    {link.name}
                                    {location.pathname === link.path && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-primary rounded-full"
                                        />
                                    )}
                                </Link>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Search (Icon Only for now) */}
                            <button className="p-2 text-gray-600 hover:text-brand-primary hover:bg-white/50 rounded-full transition-all hidden sm:block">
                                <Search size={20} />
                            </button>

                            {/* Cart */}
                            <Link to="/cart" className="relative p-2 hover:bg-white/50 rounded-full transition-all group">
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

                            {/* User / Login */}
                            {user ? (
                                <div className="hidden md:flex items-center gap-4">
                                    <span className="text-sm font-medium text-brand-dark">
                                        Welcome, <span className="text-brand-primary">{user.name.split(' ')[0]}</span>
                                    </span>
                                    <button
                                        onClick={logout}
                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                        title="Logout"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <Link to="/signin" className="hidden md:block">
                                    <Button variant="primary" size="sm" className="rounded-full px-5 text-xs uppercase tracking-wider">
                                        Sign In
                                    </Button>
                                </Link>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="md:hidden p-2 text-gray-700 hover:bg-white/50 rounded-full transition-colors"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 h-full w-[280px] bg-white z-50 shadow-2xl md:hidden flex flex-col"
                        >
                            <div className="p-6 flex items-center justify-between border-b border-gray-100">
                                <span className="font-display text-xl font-bold text-brand-dark">Menu</span>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} className="text-gray-600" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            "block px-4 py-3 rounded-xl text-lg font-medium transition-colors",
                                            location.pathname === link.path
                                                ? "bg-brand-primary/10 text-brand-primary"
                                                : "text-gray-700 hover:bg-gray-50"
                                        )}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="p-6 border-t border-gray-100 space-y-3">
                                {user ? (
                                    <>
                                        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl mb-2">
                                            <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary">
                                                <User size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 leading-none">{user.name}</span>
                                                <span className="text-xs text-gray-500 mt-1">{user.email}</span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="w-full rounded-xl text-red-600 hover:bg-red-50 hover:text-red-600 justify-start h-12"
                                            onClick={logout}
                                        >
                                            <LogOut size={18} className="mr-2" /> Logout
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/signin" className="block">
                                            <Button className="w-full rounded-xl">Sign In</Button>
                                        </Link>
                                        <Link to="/signup" className="block text-center text-sm text-gray-500 hover:text-brand-primary">
                                            Create account
                                        </Link>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

