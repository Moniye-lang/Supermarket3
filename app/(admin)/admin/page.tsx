"use client";
import { useState, useEffect, useContext } from "react";
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, TrendingDown, AlertTriangle, ChevronRight, BarChart3, UserCheck, UserX, Shield, Zap, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ComposedChart, AreaChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import pusherClient from "@/lib/pusher-client";
import { AuthContext } from "@/context/AuthContext";

export default function AdminDashboardHome() {
    const { token } = useContext(AuthContext);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("weekly");
    const [chartType, setChartType] = useState<"area" | "bar">("area");
    const [activeMetric, setActiveMetric] = useState<"both" | "revenue" | "orders">("both");

    const [staffSummary, setStaffSummary] = useState({ availableWorkers: 0, totalWorkers: 0, availableRiders: 0, totalRiders: 0 });
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

        const fetchStaff = async () => {
            try {
                const res = await fetch(`${API_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${currentToken}` }
                });
                const data = await res.json();
                if (res.ok && Array.isArray(data)) {
                    const workers = data.filter((u: any) => u.role === "worker");
                    const riders = data.filter((u: any) => u.role === "rider");
                    setStaffSummary({
                        totalWorkers: workers.length,
                        availableWorkers: workers.filter((w: any) => w.status === "available").length,
                        totalRiders: riders.length,
                        availableRiders: riders.filter((r: any) => r.status === "available").length
                    });
                }
            } catch (err) {
                console.error("Failed to fetch staff list", err);
            }
        };

        fetchAnalytics();
        fetchStaff();

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
                                        {/* Chart Header */}
                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                                            <div>
                                                <h2 className="text-xl font-black text-gray-900">Performance Overview</h2>
                                                <p className="text-sm text-gray-500 mt-0.5">Revenue & order volume over the {period}.</p>
                                            </div>
                                            {/* Chart type switcher */}
                                            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                                <button
                                                    onClick={() => setChartType("area")}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        chartType === "area" ? "bg-white shadow text-brand-primary" : "text-gray-400 hover:text-gray-600"
                                                    }`}
                                                >Area</button>
                                                <button
                                                    onClick={() => setChartType("bar")}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        chartType === "bar" ? "bg-white shadow text-brand-primary" : "text-gray-400 hover:text-gray-600"
                                                    }`}
                                                >Bar</button>
                                            </div>
                                        </div>

                                        {/* KPI summary strip */}
                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            {[
                                                {
                                                    label: "Total Revenue",
                                                    value: `₦${(chartData.reduce((s: number, d: any) => s + (d.revenue || 0), 0) / 1000).toFixed(1)}k`,
                                                    color: "text-brand-primary",
                                                    bg: "bg-red-50",
                                                    dot: "bg-brand-primary",
                                                    metric: "revenue" as const,
                                                },
                                                {
                                                    label: "Total Orders",
                                                    value: chartData.reduce((s: number, d: any) => s + (d.orders || 0), 0),
                                                    color: "text-indigo-600",
                                                    bg: "bg-indigo-50",
                                                    dot: "bg-indigo-500",
                                                    metric: "orders" as const,
                                                },
                                                {
                                                    label: "Avg Order Value",
                                                    value: (() => {
                                                        const totalRev = chartData.reduce((s: number, d: any) => s + (d.revenue || 0), 0);
                                                        const totalOrd = chartData.reduce((s: number, d: any) => s + (d.orders || 0), 0);
                                                        return totalOrd > 0 ? `₦${Math.round(totalRev / totalOrd).toLocaleString()}` : "—";
                                                    })(),
                                                    color: "text-emerald-600",
                                                    bg: "bg-emerald-50",
                                                    dot: "bg-emerald-500",
                                                    metric: "both" as const,
                                                },
                                            ].map((kpi) => (
                                                <button
                                                    key={kpi.label}
                                                    onClick={() => setActiveMetric(activeMetric === kpi.metric ? "both" : kpi.metric)}
                                                    className={`text-left p-3 rounded-2xl border-2 transition-all ${
                                                        activeMetric === kpi.metric
                                                            ? `${kpi.bg} border-current ${kpi.color}`
                                                            : "bg-gray-50 border-transparent hover:border-gray-200"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className={`w-2 h-2 rounded-full ${kpi.dot}`} />
                                                        <span className="text-xs text-gray-500 font-semibold">{kpi.label}</span>
                                                    </div>
                                                    <p className={`text-lg font-black ${activeMetric === kpi.metric ? kpi.color : "text-gray-800"}`}>{kpi.value}</p>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Recharts Composed Chart */}
                                        <div className="h-[320px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }} barCategoryGap="30%">
                                                    <defs>
                                                        <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#AD343E" stopOpacity={0.25}/>
                                                            <stop offset="100%" stopColor="#AD343E" stopOpacity={0}/>
                                                        </linearGradient>
                                                        <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.18}/>
                                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                                                        </linearGradient>
                                                        <filter id="glow">
                                                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                                            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                                                        </filter>
                                                    </defs>

                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />

                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: 600 }}
                                                        dy={12}
                                                    />

                                                    {/* Left axis: Revenue */}
                                                    <YAxis
                                                        yAxisId="rev"
                                                        orientation="left"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: 600 }}
                                                        tickFormatter={(v) => `₦${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                                                        hide={activeMetric === "orders"}
                                                    />

                                                    {/* Right axis: Orders */}
                                                    <YAxis
                                                        yAxisId="ord"
                                                        orientation="right"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: 600 }}
                                                        tickFormatter={(v) => `${v} ord`}
                                                        hide={activeMetric === "revenue"}
                                                    />

                                                    <Tooltip
                                                        cursor={{ stroke: "#e5e7eb", strokeWidth: 1, fill: "rgba(243,244,246,0.5)" }}
                                                        contentStyle={{
                                                            borderRadius: "16px",
                                                            border: "1px solid #f3f4f6",
                                                            boxShadow: "0 20px 40px -8px rgb(0 0 0 / 0.12)",
                                                            padding: "12px 16px",
                                                            backgroundColor: "#fff"
                                                        }}
                                                        labelStyle={{ fontWeight: 800, fontSize: 12, color: "#111827", marginBottom: 6 }}
                                                        formatter={(value: any, name: string) =>
                                                            name === "revenue"
                                                                ? [`₦${Number(value).toLocaleString()}`, "Revenue"]
                                                                : [value, "Orders"]
                                                        }
                                                    />

                                                    <Legend
                                                        iconType="circle"
                                                        iconSize={8}
                                                        wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 16 }}
                                                        formatter={(v) => v === "revenue" ? "Revenue" : "Orders"}
                                                    />

                                                    {/* Revenue — Area or Bar */}
                                                    {activeMetric !== "orders" && chartType === "area" && (
                                                        <Area
                                                            yAxisId="rev"
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            stroke="#AD343E"
                                                            strokeWidth={3}
                                                            fill="url(#gradRevenue)"
                                                            dot={{ r: 0 }}
                                                            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff", fill: "#AD343E" }}
                                                            animationDuration={1200}
                                                        />
                                                    )}
                                                    {activeMetric !== "orders" && chartType === "bar" && (
                                                        <Bar
                                                            yAxisId="rev"
                                                            dataKey="revenue"
                                                            fill="#AD343E"
                                                            radius={[6, 6, 0, 0]}
                                                            maxBarSize={28}
                                                            animationDuration={900}
                                                            fillOpacity={0.9}
                                                        />
                                                    )}

                                                    {/* Orders — always Line when area mode, Bar otherwise */}
                                                    {activeMetric !== "revenue" && chartType === "area" && (
                                                        <Line
                                                            yAxisId="ord"
                                                            type="monotone"
                                                            dataKey="orders"
                                                            stroke="#6366f1"
                                                            strokeWidth={2.5}
                                                            dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                                                            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff", fill: "#6366f1" }}
                                                            strokeDasharray="6 3"
                                                            animationDuration={1200}
                                                        />
                                                    )}
                                                    {activeMetric !== "revenue" && chartType === "bar" && (
                                                        <Bar
                                                            yAxisId="ord"
                                                            dataKey="orders"
                                                            fill="#6366f1"
                                                            radius={[6, 6, 0, 0]}
                                                            maxBarSize={14}
                                                            animationDuration={900}
                                                            fillOpacity={0.7}
                                                        />
                                                    )}
                                                </ComposedChart>
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

                                {/* Worker Fleet & Active Staff Summary */}
                                <div className="bg-gradient-to-r from-gray-900 via-zinc-900 to-black text-white rounded-3xl p-8 shadow-xl border border-zinc-800">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 text-brand-primary flex items-center justify-center border border-brand-primary/30">
                                                <UserCheck size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black uppercase tracking-tight">Worker & Delivery Fleet Status</h2>
                                                <p className="text-xs text-zinc-400 font-medium">Real-time availability of fulfillment workers and delivery riders</p>
                                            </div>
                                        </div>
                                        <a href="/admin/users" className="text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-1.5">
                                            Manage Staff <ChevronRight size={14} />
                                        </a>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                                        <div className="bg-zinc-800/60 border border-zinc-700/50 p-4 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-zinc-400 font-bold uppercase">Pickup Workers</p>
                                                <p className="text-2xl font-black text-white mt-1">{staffSummary.availableWorkers} <span className="text-xs font-normal text-zinc-400">/ {staffSummary.totalWorkers} active</span></p>
                                            </div>
                                            <span className={`w-3 h-3 rounded-full ${staffSummary.availableWorkers > 0 ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-rose-500"}`} />
                                        </div>

                                        <div className="bg-zinc-800/60 border border-zinc-700/50 p-4 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-zinc-400 font-bold uppercase">Delivery Riders</p>
                                                <p className="text-2xl font-black text-white mt-1">{staffSummary.availableRiders} <span className="text-xs font-normal text-zinc-400">/ {staffSummary.totalRiders} active</span></p>
                                            </div>
                                            <span className={`w-3 h-3 rounded-full ${staffSummary.availableRiders > 0 ? "bg-blue-500 shadow-[0_0_10px_#3b82f6]" : "bg-rose-500"}`} />
                                        </div>

                                        <div className="bg-zinc-800/60 border border-zinc-700/50 p-4 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-zinc-400 font-bold uppercase">Dispatch Efficiency</p>
                                                <p className="text-2xl font-black text-emerald-400 mt-1">100%</p>
                                            </div>
                                            <Sparkles size={20} className="text-emerald-400" />
                                        </div>

                                        <div className="bg-zinc-800/60 border border-zinc-700/50 p-4 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-zinc-400 font-bold uppercase">Auto-Assign Status</p>
                                                <p className="text-sm font-black text-brand-primary uppercase mt-1">Ready</p>
                                            </div>
                                            <Zap size={20} className="text-amber-400" />
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
