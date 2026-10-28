"use client";
import { useState, useEffect, useContext, useCallback } from "react";
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, TrendingDown, AlertTriangle, ChevronRight, BarChart3, UserCheck, UserX, Shield, Zap, Sparkles, Eye, Search, RefreshCw, X, Check, ShoppingBag, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ComposedChart, AreaChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, PieChart, Pie, Cell } from "recharts";
import pusherClient from "@/lib/pusher-client";
import { AuthContext } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";

export default function AdminDashboardHome() {
    const { token } = useContext(AuthContext);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("daily");
    const [chartType, setChartType] = useState<"area" | "bar">("area");
    const [activeMetric, setActiveMetric] = useState<"both" | "revenue" | "orders">("both");

    const [staffSummary, setStaffSummary] = useState({ availableWorkers: 0, totalWorkers: 0, availableRiders: 0, totalRiders: 0 });
    const API_URL = "";

    // Sold Products Modal State
    const [showSoldProductsModal, setShowSoldProductsModal] = useState(false);
    const [soldSearchQuery, setSoldSearchQuery] = useState("");

    // Inventory & Out of Stock Sync State
    const [inventoryTab, setInventoryTab] = useState<"out_of_stock" | "low_stock">("out_of_stock");
    const [syncingInventory, setSyncingInventory] = useState(false);
    const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    // Restock Modal State
    const [restockProduct, setRestockProduct] = useState<any>(null);
    const [restockQty, setRestockQty] = useState("10");
    const [restocking, setRestocking] = useState(false);

    const fetchAnalytics = useCallback(async () => {
        const currentToken = token || localStorage.getItem("token");
        if (!currentToken) return;
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
    }, [token, period]);

    const handleSyncInventory = async () => {
        const currentToken = token || localStorage.getItem("token");
        try {
            setSyncingInventory(true);
            setSyncMessage(null);
            const res = await fetch(`${API_URL}/api/admin/inventory/sync`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                    "Content-Type": "application/json"
                }
            });
            const data = await res.json();
            if (res.ok) {
                setLastSyncedTime(new Date().toLocaleTimeString());
                setSyncMessage(data.syncedWithStoreApp ? "Synced with StoreApp POS & Database!" : "Inventory synchronized successfully!");
                await fetchAnalytics();
            } else {
                setSyncMessage(data.error || "Failed to sync inventory");
            }
        } catch (err: any) {
            setSyncMessage(err.message || "Network error syncing inventory");
        } finally {
            setSyncingInventory(false);
            setTimeout(() => setSyncMessage(null), 4000);
        }
    };

    const handleConfirmRestock = async () => {
        if (!restockProduct) return;
        const currentToken = token || localStorage.getItem("token");
        const qtyNum = parseInt(restockQty, 10);
        if (isNaN(qtyNum) || qtyNum <= 0) {
            alert("Please enter a valid restock quantity greater than 0");
            return;
        }

        try {
            setRestocking(true);
            const res = await fetch(`${API_URL}/api/stock/adjust`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    productId: restockProduct.id || restockProduct._id,
                    adjustBy: qtyNum,
                    remarks: `Admin restocked +${qtyNum} units`
                })
            });
            const data = await res.json();
            if (res.ok) {
                setRestockProduct(null);
                setRestockQty("10");
                await fetchAnalytics();
            } else {
                alert(data.error || "Failed to restock product");
            }
        } catch (err: any) {
            alert(err.message || "Error restocking product");
        } finally {
            setRestocking(false);
        }
    };

    useEffect(() => {
        const currentToken = token || localStorage.getItem("token");
        if (!currentToken) return;

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
        channel.bind("orderUpdated", handleUpdate);
        channel.bind("order:status", handleUpdate);
        channel.bind("stockUpdated", handleUpdate);

        return () => {
            channel.unbind("orderCreated", handleUpdate);
            channel.unbind("orderUpdated", handleUpdate);
            channel.unbind("order:status", handleUpdate);
            channel.unbind("stockUpdated", handleUpdate);
            pusherClient.unsubscribe("admin-orders");
        };
    }, [token, period, fetchAnalytics]);

    const stats = [
        { 
            title: period === "daily" ? "Daily Revenue" : `${period.charAt(0).toUpperCase() + period.slice(1)} Revenue`, 
            value: `₦ ${analytics?.period?.revenue?.toLocaleString() || 0}`, 
            growth: analytics?.period?.revenueGrowth,
            icon: DollarSign, 
            color: "text-emerald-600", 
            bg: "bg-emerald-50" 
        },
        { 
            title: period === "daily" ? "Daily Orders" : `${period.charAt(0).toUpperCase() + period.slice(1)} Orders`, 
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
                                                    label: period === "daily" ? "Daily Revenue" : "Total Revenue",
                                                    value: `₦${(chartData.reduce((s: number, d: any) => s + (d.revenue || 0), 0) || 0).toLocaleString()}`,
                                                    color: "text-brand-primary",
                                                    bg: "bg-red-50",
                                                    dot: "bg-brand-primary",
                                                    metric: "revenue" as const,
                                                },
                                                {
                                                    label: period === "daily" ? "Daily Orders" : "Total Orders",
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
                                                        formatter={(value: any, name: any) =>
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
                                        <div className="mt-8 flex flex-col gap-2">
                                            <button
                                                onClick={() => setShowSoldProductsModal(true)}
                                                className="w-full py-4 rounded-2xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <Eye size={16} /> View Sold Products ({analytics?.soldProducts?.length || analytics?.topProducts?.length || 0}) <ChevronRight size={16} />
                                            </button>
                                            <a href="/admin/products" className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-600 font-semibold text-xs hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5 text-center">
                                                Manage Catalog in Products Inventory &rarr;
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Shopping Category Pie Chart */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                                    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900">Sales by Category</h2>
                                            <p className="text-sm text-gray-500 mt-0.5">Revenue breakdown across all shopping categories.</p>
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 uppercase tracking-wider">
                                            {period} period
                                        </span>
                                    </div>
                                    {(!analytics?.categoryDistribution || analytics.categoryDistribution.length === 0) ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                                <Package size={28} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-medium">No category sales data yet for this period.</p>
                                        </div>
                                    ) : (
                                    <div className="flex flex-col lg:flex-row items-center gap-10">
                                        {/* Donut Pie */}
                                        <div className="w-full lg:w-[280px] h-[280px] flex-shrink-0 relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={analytics.categoryDistribution}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={70}
                                                        outerRadius={112}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                        animationBegin={0}
                                                        animationDuration={1000}
                                                        stroke="none"
                                                    >
                                                        {analytics.categoryDistribution.map((entry: any, idx: number) => (
                                                            <Cell key={`cell-${idx}`} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            borderRadius: "14px",
                                                            border: "1px solid #f3f4f6",
                                                            boxShadow: "0 12px 30px -4px rgb(0 0 0 / 0.1)",
                                                            padding: "10px 14px",
                                                        }}
                                                        formatter={(value: any, name: any) => [`₦${Number(value).toLocaleString()}`, name]}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            {/* Center label */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</p>
                                                <p className="text-lg font-black text-gray-900">
                                                    ₦{analytics.categoryDistribution.reduce((s: number, e: any) => s + e.value, 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Legend stat cards */}
                                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                                            {analytics.categoryDistribution.map((entry: any) => {
                                                const total = analytics.categoryDistribution.reduce((s: number, e: any) => s + e.value, 0);
                                                const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                                                return (
                                                    <div
                                                        key={entry.name}
                                                        className="p-4 rounded-2xl border border-transparent hover:border-gray-100 transition-all cursor-default"
                                                        style={{ backgroundColor: entry.fill + "12" }}
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                                                            <span className="text-xs font-bold text-gray-600 truncate">{entry.name}</span>
                                                        </div>
                                                        <p className="text-xl font-black" style={{ color: entry.fill }}>
                                                            ₦{Number(entry.value).toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{entry.qty} units sold</p>
                                                        <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{ width: `${pct}%`, backgroundColor: entry.fill }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1 font-semibold">{pct}%</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    )}
                                </div>

                                {/* Inventory & Out-of-Stock Sync */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                                                    <AlertTriangle size={20} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-black text-gray-900">Inventory &amp; Stock Sync</h2>
                                                    <p className="text-xs text-gray-500 font-medium">Real-time out of stock &amp; low stock monitoring</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleSyncInventory}
                                                disabled={syncingInventory}
                                                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                                                title="Sync stock with StoreApp POS and MongoDB"
                                            >
                                                <RefreshCw size={13} className={syncingInventory ? "animate-spin text-brand-primary" : "text-gray-500"} />
                                                <span>{syncingInventory ? "Syncing..." : "Sync Stock"}</span>
                                            </button>
                                        </div>

                                        {syncMessage && (
                                            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                                                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                                                <span>{syncMessage}</span>
                                            </div>
                                        )}

                                        {/* Subtabs for Out of Stock vs Low Stock */}
                                        <div className="flex items-center gap-2 mb-4 p-1 bg-gray-50 rounded-xl border border-gray-100 w-fit">
                                            <button
                                                onClick={() => setInventoryTab("out_of_stock")}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                    inventoryTab === "out_of_stock"
                                                        ? "bg-rose-500 text-white shadow-sm"
                                                        : "text-gray-500 hover:text-gray-800"
                                                }`}
                                            >
                                                <span>Out of Stock</span>
                                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                                    inventoryTab === "out_of_stock" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
                                                }`}>
                                                    {analytics?.outOfStockCount ?? analytics?.outOfStockProducts?.length ?? 0}
                                                </span>
                                            </button>

                                            <button
                                                onClick={() => setInventoryTab("low_stock")}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                    inventoryTab === "low_stock"
                                                        ? "bg-amber-500 text-white shadow-sm"
                                                        : "text-gray-500 hover:text-gray-800"
                                                }`}
                                            >
                                                <span>Low Stock (≤ 10)</span>
                                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                                    inventoryTab === "low_stock" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                                                }`}>
                                                    {analytics?.lowStockCount ?? analytics?.lowStockProducts?.length ?? 0}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Product list */}
                                        <div className="flex-1 overflow-y-auto max-h-[360px] space-y-3 pr-1">
                                            {inventoryTab === "out_of_stock" ? (
                                                (analytics?.outOfStockProducts && analytics.outOfStockProducts.length > 0) ? (
                                                    analytics.outOfStockProducts.map((product: any) => (
                                                        <div
                                                            key={product.id}
                                                            className="bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-10 h-10 rounded-xl bg-white border border-rose-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                                    {product.image ? (
                                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Package size={18} className="text-gray-300" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-gray-900 text-sm truncate">{product.name}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[11px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                                                                            0 units • Out of stock
                                                                        </span>
                                                                        <span className="text-xs text-gray-400">₦{Number(product.price || 0).toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setRestockProduct(product);
                                                                    setRestockQty("10");
                                                                }}
                                                                className="px-3 py-1.5 rounded-xl bg-brand-primary text-white font-bold text-xs hover:bg-brand-primary/90 transition-all shadow-sm flex-shrink-0 cursor-pointer"
                                                            >
                                                                Restock
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-10">
                                                        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                                                            <CheckCircle2 size={24} />
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-800">No out-of-stock items!</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">All products in the store catalog have available stock.</p>
                                                    </div>
                                                )
                                            ) : (
                                                (analytics?.lowStockProducts && analytics.lowStockProducts.length > 0) ? (
                                                    analytics.lowStockProducts.map((product: any) => (
                                                        <div
                                                            key={product.id}
                                                            className="bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-10 h-10 rounded-xl bg-white border border-amber-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                                    {product.image ? (
                                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Package size={18} className="text-gray-300" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-gray-900 text-sm truncate">{product.name}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                                                                            {product.stock} units left
                                                                        </span>
                                                                        <span className="text-xs text-gray-400">₦{Number(product.price || 0).toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setRestockProduct(product);
                                                                    setRestockQty("10");
                                                                }}
                                                                className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-all shadow-sm flex-shrink-0 cursor-pointer"
                                                            >
                                                                Restock
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-10">
                                                        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                                                            <CheckCircle2 size={24} />
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-800">No low-stock items!</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">All products currently have more than 10 units in stock.</p>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        {lastSyncedTime && (
                                            <p className="text-[11px] text-gray-400 mt-3 text-center">
                                                Last synchronized at {lastSyncedTime}
                                            </p>
                                        )}
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
                                                <h2 className="text-xl font-black uppercase tracking-tight">Store Fulfillment &amp; Staff Status</h2>
                                                <p className="text-xs text-zinc-400 font-medium">Real-time availability of store workers and packaging staff</p>
                                            </div>
                                        </div>
                                        <a href="/admin/users" className="text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-1.5">
                                            Manage Staff <ChevronRight size={14} />
                                        </a>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        <div className="bg-zinc-800/60 border border-zinc-700/50 p-4 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-zinc-400 font-bold uppercase">Store Staff &amp; Workers</p>
                                                <p className="text-2xl font-black text-white mt-1">{staffSummary.availableWorkers} <span className="text-xs font-normal text-zinc-400">/ {staffSummary.totalWorkers} active</span></p>
                                            </div>
                                            <span className={`w-3 h-3 rounded-full ${staffSummary.availableWorkers > 0 ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-rose-500"}`} />
                                        </div>

                                        <div className="bg-zinc-800/60 border border-zinc-700/50 p-4 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-zinc-400 font-bold uppercase">Fulfillment Efficiency</p>
                                                <p className="text-2xl font-black text-emerald-400 mt-1">100%</p>
                                            </div>
                                            <Sparkles size={20} className="text-emerald-400" />
                                        </div>

                                        <div className="bg-zinc-800/60 border border-zinc-700/50 p-4 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-zinc-400 font-bold uppercase">Order Processing</p>
                                                <p className="text-sm font-black text-brand-primary uppercase mt-1">Active</p>
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

            {/* View Sold Products Modal */}
            <AnimatePresence>
                {showSoldProductsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Sold Products &amp; Sales Volume</h3>
                                        <p className="text-xs text-gray-500 font-medium">All products sold across verified, paid customer orders.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowSoldProductsModal(false);
                                        setSoldSearchQuery("");
                                    }}
                                    className="w-10 h-10 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Summary Metrics Strip */}
                            <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50/80 border-b border-gray-100">
                                <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Unique Items Sold</p>
                                    <p className="text-xl font-black text-gray-900 mt-0.5">
                                        {analytics?.soldProducts?.length || 0}
                                    </p>
                                </div>
                                <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Units Sold</p>
                                    <p className="text-xl font-black text-indigo-600 mt-0.5">
                                        {(analytics?.soldProducts || []).reduce((acc: number, p: any) => acc + (p.sales || 0), 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue Generated</p>
                                    <p className="text-xl font-black text-emerald-600 mt-0.5">
                                        ₦{((analytics?.soldProducts || []).reduce((acc: number, p: any) => acc + (p.revenue || 0), 0) || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Search Filter */}
                            <div className="p-4 border-b border-gray-100 bg-white">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        value={soldSearchQuery}
                                        onChange={(e) => setSoldSearchQuery(e.target.value)}
                                        placeholder="Search sold products by name, category, or SKU..."
                                        className="pl-10 pr-10 py-2.5 rounded-xl border-gray-200 text-sm focus:border-brand-primary"
                                    />
                                    {soldSearchQuery && (
                                        <button
                                            onClick={() => setSoldSearchQuery("")}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Product List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[50vh]">
                                {(() => {
                                    const filtered = (analytics?.soldProducts || []).filter((p: any) => {
                                        if (!soldSearchQuery.trim()) return true;
                                        const q = soldSearchQuery.toLowerCase();
                                        return (
                                            p.name?.toLowerCase().includes(q) ||
                                            p.category?.toLowerCase().includes(q) ||
                                            p.sku?.toLowerCase().includes(q)
                                        );
                                    });

                                    if (filtered.length === 0) {
                                        return (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 mx-auto rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-3">
                                                    <Package size={28} />
                                                </div>
                                                <p className="text-gray-700 font-bold text-base">No sold products found</p>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    {soldSearchQuery ? `No products matching "${soldSearchQuery}"` : "Verified customer purchases will automatically appear here."}
                                                </p>
                                            </div>
                                        );
                                    }

                                    return filtered.map((item: any, idx: number) => (
                                        <div
                                            key={item.id || idx}
                                            className="bg-white border border-gray-100 hover:border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-14 h-14 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={22} className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 text-sm">{item.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                                                            {item.category || "General"}
                                                        </span>
                                                        {item.sku && (
                                                            <span className="text-gray-400 text-[11px]">SKU: {item.sku}</span>
                                                        )}
                                                        <span className="text-gray-500 font-medium">₦{Number(item.price || 0).toLocaleString()} / unit</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Volume Sold</p>
                                                    <p className="text-base font-black text-indigo-600">
                                                        {item.sales} <span className="text-xs font-semibold text-gray-500">units</span>
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Sales</p>
                                                    <p className="text-base font-black text-gray-900">
                                                        ₦{Number(item.revenue || 0).toLocaleString()}
                                                    </p>
                                                </div>

                                                <div className="text-right pl-2 border-l border-gray-100 hidden sm:block">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Stock Left</p>
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mt-0.5 ${
                                                        (item.currentStock ?? 0) <= 0
                                                            ? "bg-rose-100 text-rose-700"
                                                            : (item.currentStock ?? 0) <= 10
                                                            ? "bg-amber-100 text-amber-700"
                                                            : "bg-emerald-100 text-emerald-700"
                                                    }`}>
                                                        {(item.currentStock ?? 0) <= 0 ? "Out of stock" : `${item.currentStock} in stock`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                                <a
                                    href="/admin/products"
                                    className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                                >
                                    Open Full Inventory Catalog &rarr;
                                </a>
                                <button
                                    onClick={() => {
                                        setShowSoldProductsModal(false);
                                        setSoldSearchQuery("");
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Restock Modal */}
            <AnimatePresence>
                {restockProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative"
                        >
                            <button
                                onClick={() => setRestockProduct(null)}
                                className="absolute top-5 right-5 w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Restock Product</h3>
                                    <p className="text-xs text-gray-500 font-medium">Update current available inventory in store</p>
                                </div>
                            </div>

                            <div className="p-3.5 bg-gray-50 rounded-2xl flex items-center gap-3 mb-5 border border-gray-100">
                                <div className="w-12 h-12 rounded-xl bg-white flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
                                    {restockProduct.image ? (
                                        <img src={restockProduct.image} alt={restockProduct.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package size={20} className="text-gray-300" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-gray-900 text-sm truncate">{restockProduct.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                            (restockProduct.stock ?? 0) <= 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                                        }`}>
                                            Current: {restockProduct.stock ?? 0} units
                                        </span>
                                        <span className="text-xs text-gray-400">₦{Number(restockProduct.price || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                                        Add Quantity (+units)
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={restockQty}
                                        onChange={(e) => setRestockQty(e.target.value)}
                                        className="py-2.5 rounded-xl border-gray-200 text-sm font-bold focus:border-brand-primary"
                                        placeholder="e.g. 10"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    {[5, 10, 25, 50, 100].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setRestockQty(preset.toString())}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                restockQty === preset.toString()
                                                    ? "bg-brand-primary text-white border-brand-primary"
                                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            +{preset}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                                    <span className="text-blue-700 font-medium">New Stock Total:</span>
                                    <span className="font-black text-blue-900 text-sm">
                                        {(Number(restockProduct.stock) || 0) + (parseInt(restockQty, 10) || 0)} units
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setRestockProduct(null)}
                                    disabled={restocking}
                                    className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmRestock}
                                    disabled={restocking || !restockQty || parseInt(restockQty, 10) <= 0}
                                    className="flex-1 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {restocking ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Restocking...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} /> Confirm Restock
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
