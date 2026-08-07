import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { verifyAdmin } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Verify Admin access
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required!" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "weekly"; // daily, weekly, monthly

    // Date ranges
    const now = new Date();
    let currentStart: Date, previousStart: Date;

    if (period === "daily") {
      currentStart = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      previousStart = new Date(currentStart.getTime() - (24 * 60 * 60 * 1000));
    } else if (period === "monthly") {
      currentStart = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      previousStart = new Date(currentStart.getTime() - (30 * 24 * 60 * 60 * 1000));
    } else { // weekly default
      currentStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      previousStart = new Date(currentStart.getTime() - (7 * 24 * 60 * 60 * 1000));
    }

    // Core Stats
    const totalUsers = await User.countDocuments({ role: "customer" });
    const totalWorkers = await User.countDocuments({ role: { $in: ["worker", "rider"] } });
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } }).limit(5);
    
    // Period Analysis
    const currentOrders = await Order.find({ createdAt: { $gte: currentStart } });
    const previousOrders = await Order.find({ createdAt: { $gte: previousStart, $lt: currentStart } });

    const currentRevenue = currentOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    
    const currentOrderCount = currentOrders.length;
    const previousOrderCount = previousOrders.length;

    // Growth Calculation
    const calculateGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const revenueGrowth = calculateGrowth(currentRevenue, previousRevenue);
    const orderGrowth = calculateGrowth(currentOrderCount, previousOrderCount);

    // Chart Data (Trend)
    const trendData = [];
    const points = period === "daily" ? 24 : period === "monthly" ? 30 : 7;
    const interval = period === "daily" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - (i * interval));
      const dateStr = period === "daily" 
        ? d.getHours() + ":00" 
        : d.toISOString().split('T')[0];
      
      const matchingOrders = currentOrders.filter(o => {
        const od = new Date(o.createdAt);
        if (period === "daily") return od.getHours() === d.getHours() && od.toDateString() === d.toDateString();
        return od.toISOString().split('T')[0] === dateStr;
      });
      const rev = matchingOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

      trendData.push({ name: dateStr, revenue: rev, orders: matchingOrders.length });
    }

    // Top Products & Category breakdown
    const productStats: Record<string, { qty: number; revenue: number; name: string; image: string }> = {};
    const categoryStats: Record<string, { revenue: number; qty: number }> = {};

    currentOrders.forEach(order => {
      order.items.forEach((item: any) => {
        const pid = String(item.productId || item._id || "unknown");
        const name = item.name || item.title || "Product";
        const image = item.image || "";
        const price = Number(item.price) || 0;
        const qty = Number(item.qty) || 1;

        if (!productStats[pid]) {
          productStats[pid] = { qty: 0, revenue: 0, name, image };
        }
        productStats[pid].qty += qty;
        productStats[pid].revenue += (price * qty);

        const cat = item.category || "General";
        if (!categoryStats[cat]) categoryStats[cat] = { revenue: 0, qty: 0 };
        categoryStats[cat].revenue += (price * qty);
        categoryStats[cat].qty += qty;
      });
    });

    const topProductIds = Object.keys(productStats)
      .sort((a, b) => productStats[b].revenue - productStats[a].revenue)
      .slice(0, 5);
    
    const topProducts = await Promise.all(topProductIds.map(async id => {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id);
      }
      return {
        name: product ? product.name : (productStats[id].name || `Product #${id}`),
        image: product ? product.image : productStats[id].image,
        sales: productStats[id].qty,
        revenue: productStats[id].revenue
      };
    }));

    // Category Revenue Breakdown
    const categoryColors: Record<string, string> = {
      "Fruits": "#10b981",
      "Vegetables": "#22c55e",
      "Dairy": "#3b82f6",
      "Meat": "#ef4444",
      "Bakery": "#f97316",
      "Beverages": "#8b5cf6",
      "Snacks": "#f59e0b",
      "Seafood": "#06b6d4",
      "Frozen": "#60a5fa",
      "Household": "#a855f7",
      "Personal Care": "#ec4899",
      "General": "#9ca3af",
      "Uncategorized": "#9ca3af",
    };
    const fallbackColors = ["#6366f1","#14b8a6","#f43f5e","#84cc16","#fb923c","#a78bfa"];

    const sortedCategories = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b.revenue - a.revenue);
    
    const categoryDistribution = sortedCategories.map(([name, stats], idx) => ({
      name,
      value: stats.revenue,
      qty: stats.qty,
      fill: categoryColors[name] || fallbackColors[idx % fallbackColors.length],
    }));

    return NextResponse.json({
      summary: {
        totalUsers,
        totalWorkers,
        totalProducts,
        totalOrders: await Order.countDocuments(),
        totalRevenue: (await Order.find()).reduce((sum, o) => sum + (o.amount || 0), 0),
        pendingOrders: await Order.countDocuments({ fulfilled: false }),
      },
      period: {
        revenue: currentRevenue,
        revenueGrowth,
        orders: currentOrderCount,
        orderGrowth,
        newUsers: await User.countDocuments({ role: "customer", createdAt: { $gte: currentStart } }),
        newUserGrowth: calculateGrowth(
          await User.countDocuments({ role: "customer", createdAt: { $gte: currentStart } }),
          await User.countDocuments({ role: "customer", createdAt: { $gte: previousStart, $lt: currentStart } })
        )
      },
      trendData,
      topProducts,
      lowStockProducts: lowStockProducts.map(p => ({ name: p.name, stock: p.stock, id: p._id })),
      categoryDistribution,
    });
  } catch (err: any) {
    console.error("Analytics Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
