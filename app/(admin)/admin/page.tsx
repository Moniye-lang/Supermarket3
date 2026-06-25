"use client";
import { useState, useEffect, useContext } from "react";
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, TrendingDown, AlertTriangle, ChevronRight, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import pusherClient from "@/lib/pusher-client";
import { AuthContext } from "@/context/AuthContext";

export default function AdminDashboardHome() {
    const { token } = useContext(AuthContext);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("weekly");

    const API_URL = "";

    useEffect(() => {
        const currentToken = token || localStorage.getItem("token");
        if (!currentToken) return;

        const fetchAnalytics = async () => {
            try {
                const res = await fetch(`${API_URL}/api/admin/analytics?period=${period}&_t=${Date.now()}`, {
                    headers: { 
                        Authorization: `Bearer ${currentToken}`,
                        "Cache-Control": "no-cache",
                        "Pragma": "no-cache"
                    }
                });
                const data = await res.json();
                if (!res.ok || data.error) {
                    setAnalytics({ error: data.error || "Failed to fetch analytics" });
                    return;
                }
                setAnalytics(data);
            } catch (err: any) {
                console.error("Failed to fetch analytics", err);
                setAnalytics({ error: err.message });
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();

        // Subscribe to Pusher for real-time dashboard updates
        const channel = pusherClient.subscribe("admin-orders");
        const handleUpdate = () => fetchAnalytics();
        channel.bind("orderCreated", handleUpdate);
        channel.bind("order:status", handleUpdate);

        return () => {
            pusherClient.unsubscribe("admin-orders");
        };
    }, [token, period]);

    const stats = [
        { 
            title: "Revenue", 
            value: `₦ ${analytics?.period?.revenue?.toLocaleString() || 0}`, 
            growth: analytics?.period?.revenueGrowth,
            icon: DollarSign, 
            color: "text-emerald-600", 
            bg: "bg-emerald-50" 
        },
        { 
            title: "Orders", 
            value: analytics?.period?.orders || 0, 
            growth: analytics?.period?.orderGrowth,
            icon: ShoppingCart, 
            color: "text-blue-600", 
            bg: "bg-blue-50" 
        },
        { 
            title: "New Users", 
            value: analytics?.period?.newUsers || 0, 
            growth: analytics?.period?.newUserGrowth,
            icon: Users, 
            color: "text-orange-600", 
            bg: "bg-orange-50" 
        },
        { 
            title: "Pending Orders", 
            value: analytics?.summary?.pendingOrders || 0, 
            icon: Package, 
            color: "text-purple-600", 
            bg: "bg-purple-50" 
        },
    ];

    const chartData = analytics?.trendData || [];

    const GrowthIndicator = ({ value }: { value?: number }) => {
        if (value === undefined) return null;
        const isPositive = value >= 0;
        return (
            <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{Math.abs(value)}%</span>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Real-time performance insights and analytics.</p>
                </div>
                
                <div className="flex items-center bg-gray-100 p-1 rounded-xl w-fit">
                    {["daily", "weekly", "monthly"].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                period === p 
                                ? "bg-white text-gray-900 shadow-sm font-bold" 
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-brand-primary animate-spin"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-primary font-bold">AM</div>
                    </div>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={period}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        {analytics?.error ? (
                            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                                <AlertTriangle size={48} className="text-rose-500" />
                                <div>
                                    <h2 className="text-2xl font-black text-rose-900">Access Denied</h2>
                                    <p className="text-rose-700 mt-2">{analytics.error}</p>
                                    <p className="text-rose-600/60 text-sm mt-4 italic">Try logging out and logging back in if you recently changed permissions.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Stat Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {stats.map((stat) => (
                                        <div
                                            key={stat.title}
                                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                                    <stat.icon size={24} />
                                                </div>
                                                <GrowthIndicator value={stat.growth} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">{stat.title}</p>
                                                <p className="text-3xl font-black text-gray-900 mt-1">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Main Chart */}
                                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h2 className="text-xl font-black text-gray-900">Revenue Trend</h2>
                                                <p className="text-sm text-gray-500">Gross revenue performance over the {period}.</p>
                                            </div>
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <BarChart3 size={20} className="text-brand-primary" />
                                            </div>
                                        </div>
                                        
                                        <div className="h-[400px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#AD343E" stopOpacity={0.15}/>
                                                            <stop offset="95%" stopColor="#AD343E" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{fill: "#9ca3af", fontSize: 11, fontWeight: 600}} 
                                                        dy={15} 
                                                    />
                                                    <YAxis 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{fill: "#9ca3af", fontSize: 11, fontWeight: 600}} 
                                                        tickFormatter={(val) => `₦${val >= 1000 ? (val/1000).toFixed(0) + "k" : val}`}
                                                    />
                                                    <Tooltip 
                                                        cursor={{ stroke: "#AD343E", strokeWidth: 2, strokeDasharray: "5 5" }}
                                                        contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)", padding: "12px" }}
                                                        labelStyle={{ fontWeight: 800, marginBottom: "4px", color: "#111827" }}
                                                        formatter={(value: any) => [`₦${value.toLocaleString()}`, "Revenue"]}
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="revenue" 
                                                        stroke="#AD343E" 
                                                        strokeWidth={4} 
                                                        fillOpacity={1} 
                                                        fill="url(#colorRevenue)" 
                                                        animationDuration={1500}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Top Products */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col">
                                        <h2 className="text-xl font-black text-gray-900 mb-6">Top Products</h2>
                                        <div className="space-y-6 flex-grow">
                                            {analytics?.topProducts?.length > 0 ? (
                                                analytics.topProducts.map((product: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden">
                                                                {product.image ? (
                                                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                        <Package size={20} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-sm line-clamp-1">{product.name}</p>
                                                                <p className="text-xs text-gray-500">{product.sales} sales</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-gray-900 text-sm">₦{product.revenue.toLocaleString()}</p>
                                                            <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${(product.revenue / analytics.topProducts[0].revenue) * 100}%` }}
                                                                    className="h-full bg-brand-primary"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50">
                                                    <ShoppingCart size={40} className="text-gray-300" />
                                                    <p className="text-sm font-medium">No sales data yet</p>
                                                </div>
                                            )}
                                        </div>
                                        <button className="mt-8 w-full py-4 rounded-2xl bg-gray-50 text-gray-900 font-bold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                                            View All Products <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Inventory Alerts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-rose-50 rounded-3xl p-8 border border-rose-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <h2 className="text-xl font-black text-rose-900">Inventory Alerts</h2>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {analytics?.lowStockProducts?.length > 0 ? (
                                                analytics.lowStockProducts.map((product: any) => (
                                                    <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 flex items-center justify-between">
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                                                            <p className="text-xs text-rose-600 font-bold">{product.stock} left in stock</p>
                                                        </div>
                                                        <button className="text-brand-primary font-black text-xs hover:underline uppercase tracking-wider cursor-pointer">Restock</button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-rose-700 text-sm font-medium">All products are well-stocked! 🎉</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                                <Users size={20} />
                                            </div>
                                            <h2 className="text-xl font-black text-emerald-900">Customer Insights</h2>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="flex-grow">
                                                <p className="text-emerald-800 text-sm font-medium mb-4">You have <span className="font-black">{analytics?.period?.newUsers}</span> new customers this {period}. Growth is <span className="font-black text-emerald-600">+{analytics?.period?.newUserGrowth}%</span>.</p>
                                                <div className="h-4 w-full bg-emerald-100 rounded-full overflow-hidden flex">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: "70%" }} 
                                                        className="h-full bg-emerald-500" 
                                                    />
                                                </div>
                                                <div className="flex justify-between mt-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                                    <span>Returning</span>
                                                    <span>New (70%)</span>
                                                </div>
                                            </div>
                                            <div className="hidden sm:block w-32 h-32 rounded-full border-[10px] border-emerald-500 border-t-emerald-200 animate-spin-slow"></div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}
