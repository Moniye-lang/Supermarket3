"use client";
import { useEffect, useState, useMemo, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { Clock, MapPin, Truck, CheckCircle, CreditCard, ShoppingBag, ChevronRight, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://supermarket3.onrender.com";
const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

export default function History() {
  const { user, token } = useContext(AuthContext);
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!token) { router.push("/signin"); return; }
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/orders/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setOrders(data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [token, router]);

  const { monthly, categories, totalSpend } = useMemo(() => {
    if (!orders || orders.length === 0) return { monthly: [], categories: [], totalSpend: 0 };
    let total = 0;
    const monthMap: Record<string, number> = {};
    const catMap: Record<string, number> = {};
    orders.forEach((order: any) => {
      const d = new Date(order.createdAt);
      const mName = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear().toString().slice(2);
      const mKey = `${mName} '${year}`;
      monthMap[mKey] = (monthMap[mKey] || 0) + order.amount;
      total += order.amount;
      order.items.forEach((it: any) => {
        const cat = it.productId?.category || "Uncategorized";
        const val = (it.price || it.productId?.price || 0) * it.qty;
        catMap[cat] = (catMap[cat] || 0) + val;
      });
    });
    const monthlyArr = Object.keys(monthMap).map((k) => ({ name: k, spend: monthMap[k] }));
    const categoriesArr = Object.keys(catMap).map((k) => ({ name: k, value: catMap[k] }));
    categoriesArr.sort((a, b) => b.value - a.value);
    return { monthly: monthlyArr.reverse(), categories: categoriesArr, totalSpend: total };
  }, [orders]);

  const getStatusBadge = (status: string, method: string) => {
    switch (status) {
      case "pending": return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
      case "processing": return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck size={12} /> Processing</span>;
      case "picked_up":
      case "delivered":
      case "completed": return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12} /> {method === "pickup" ? "Picked Up" : "Delivered"}</span>;
      case "cancelled": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold w-fit">Cancelled</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold w-fit capitalize">{status}</span>;
    }
  };

  const formatCurrency = (val: number) => `₦${val.toLocaleString()}`;

  if (loading) return (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 max-w-6xl">

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-dark mb-2">My Spending &amp; History</h1>
          <p className="text-gray-500">Track your past purchases and monitor your shopping habits.</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mb-6">
              <PackageOpen size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-500 mb-8 max-w-md">You haven&apos;t placed any orders yet. Start shopping to see your history here!</p>
            <Link href="/products">
              <button className="bg-brand-primary text-white px-8 py-3 rounded-full font-bold hover:bg-brand-primary/90 transition-colors">Start Shopping</button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* Total Spend Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-brand-primary rounded-3xl p-6 text-white shadow-xl shadow-brand-primary/20 flex flex-col justify-between overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <div>
                <div className="flex items-center gap-2 text-white/80 font-medium mb-1 relative z-10">
                  <CreditCard size={18} /><span>Total Lifetime Spend</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight relative z-10">{formatCurrency(totalSpend)}</h2>
              </div>
              <div className="mt-8 relative z-10">
                <p className="text-sm text-white/80 flex items-center gap-2"><ShoppingBag size={14} /> {orders.length} Total Orders</p>
              </div>
            </motion.div>

            {/* Monthly Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 lg:col-span-2"
            >
              <h3 className="font-bold text-gray-900 mb-6">Monthly Spending Trend</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                    <Tooltip cursor={{ fill: "#f3f4f6" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(val: any) => [formatCurrency(val), "Spend"]} />
                    <Bar dataKey="spend" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Category Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 lg:col-span-1"
            >
              <h3 className="font-bold text-gray-900 mb-2">Spend by Category</h3>
              <div className="h-[200px] w-full relative -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categories} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {categories.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => formatCurrency(val)} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4 max-h-32 overflow-y-auto pr-2">
                {categories.map((cat: any, idx: number) => (
                  <div key={cat.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-gray-600 truncate max-w-[120px]">{cat.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Orders List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 lg:col-span-2"
            >
              <h3 className="font-bold text-gray-900 mb-6">Recent Transactions</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {orders.map((order: any) => (
                  <div key={order._id} className="group rounded-2xl border border-gray-100 hover:border-brand-primary/20 hover:shadow-md transition-all bg-white overflow-hidden">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer" onClick={() => setExpandedOrderId(prev => prev === order._id ? null : order._id)}>
                      <div className="flex items-start gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", order.collectionMethod === "delivery" ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-orange-500")}>
                          {order.collectionMethod === "delivery" ? <Truck size={24} /> : <MapPin size={24} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{order.collectionMethod === "pickup" ? "Pickup" : "Delivery"} Order #{order.code || order.pickupCode}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                          <div className="mt-2">{getStatusBadge(order.status || (order.fulfilled ? "completed" : "pending"), order.collectionMethod)}</div>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0 border-gray-100">
                        <p className="text-lg font-bold text-brand-primary">{formatCurrency(order.amount)}</p>
                        <p className="text-xs text-gray-500 sm:mt-1 flex items-center gap-1">
                          {order.items?.length || 0} items
                          <ChevronRight size={14} className={`transition-transform ${expandedOrderId === order._id ? "rotate-90" : ""}`} />
                        </p>
                      </div>
                    </div>

                    {expandedOrderId === order._id && (
                      <div className="bg-gray-50/50 border-t border-gray-100 p-4">
                        <h4 className="font-bold text-gray-800 mb-3 text-sm">Order Summary</h4>
                        <div className="space-y-2 mb-4">
                          {order.items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">{item.qty}x {item.productId?.name || "Product"}</span>
                              <span className="font-medium text-gray-800">{formatCurrency((item.price || item.productId?.price || 0) * item.qty)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Customer Details</p>
                            <p className="text-sm font-medium text-gray-800">{order.pickupName}</p>
                            <p className="text-sm text-gray-600">{order.customerPhone || "No phone provided"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{order.collectionMethod === "delivery" ? "Delivery Address" : "Pickup Code"}</p>
                            <p className="text-sm font-medium text-gray-800">{order.collectionMethod === "delivery" ? order.deliveryAddress : order.pickupCode}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
