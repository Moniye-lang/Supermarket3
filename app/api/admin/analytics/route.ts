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
    const period = searchParams.get("period") || "daily"; // daily (default), weekly, monthly

    // Date ranges
    const now = new Date();
    let currentStart: Date, previousStart: Date;

    if (period === "daily") {
      // Start of today (00:00:00)
      currentStart = new Date(now);
      currentStart.setHours(0, 0, 0, 0);
      previousStart = new Date(currentStart.getTime() - (24 * 60 * 60 * 1000));
    } else if (period === "monthly") {
      currentStart = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      previousStart = new Date(currentStart.getTime() - (30 * 24 * 60 * 60 * 1000));
    } else { // weekly
      currentStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      previousStart = new Date(currentStart.getTime() - (7 * 24 * 60 * 60 * 1000));
    }

    // Verified paid order filter: only confirmed/paid orders count toward revenue and valid order metrics
    const paidOrderFilter = {
      paymentStatus: "paid",
      status: { $nin: ["cancelled", "payment_declined", "declined", "payment_pending"] },
    };

    // Active fulfillment filter: orders actively being packed/delivered, excluding cancelled or declined
    const activeFulfillmentFilter = {
      fulfilled: false,
      status: { $nin: ["cancelled", "payment_declined", "declined", "payment_pending", "delivered", "picked_up", "completed"] },
    };

    // Parallel Core Stats & Period Orders Query (Runs in parallel instead of sequential waterfalls)
    const [
      totalUsers,
      totalWorkers,
      totalProducts,
      outOfStockProducts,
      lowStockProducts,
      outOfStockCount,
      lowStockCount,
      currentOrders,
      previousOrders,
      totalOrders,
      totalRevenueAgg,
      pendingOrders,
      newUsersCurrent,
      newUsersPrevious,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: { $in: ["worker", "rider"] } }),
      Product.countDocuments(),
      Product.find({
        $or: [
          { stock: { $lte: 0 } },
          { stockStatus: { $in: ["Out of Stock", "outofstock"] } },
        ],
      })
        .select("name stock price image category sku _id updatedAt")
        .sort({ updatedAt: -1 })
        .limit(30)
        .lean(),
      Product.find({
        stock: { $gt: 0, $lte: 10 },
        stockStatus: { $nin: ["Out of Stock", "outofstock"] },
      })
        .select("name stock price image category sku _id updatedAt")
        .sort({ stock: 1 })
        .limit(30)
        .lean(),
      Product.countDocuments({
        $or: [
          { stock: { $lte: 0 } },
          { stockStatus: { $in: ["Out of Stock", "outofstock"] } },
        ],
      }),
      Product.countDocuments({
        stock: { $gt: 0, $lte: 10 },
        stockStatus: { $nin: ["Out of Stock", "outofstock"] },
      }),
      Order.find({ createdAt: { $gte: currentStart }, ...paidOrderFilter })
        .select("amount createdAt items status")
        .lean(),
      Order.find({ createdAt: { $gte: previousStart, $lt: currentStart }, ...paidOrderFilter })
        .select("amount")
        .lean(),
      Order.countDocuments(paidOrderFilter),
      Order.aggregate([
        { $match: paidOrderFilter },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Order.countDocuments(activeFulfillmentFilter),
      User.countDocuments({ role: "customer", createdAt: { $gte: currentStart } }),
      User.countDocuments({ role: "customer", createdAt: { $gte: previousStart, $lt: currentStart } }),
    ]);

    const currentRevenue = (currentOrders as any[]).reduce((sum, o) => sum + (o.amount || 0), 0);
    const previousRevenue = (previousOrders as any[]).reduce((sum, o) => sum + (o.amount || 0), 0);
    
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

    if (period === "daily") {
      const currentHour = now.getHours();
      const maxHour = Math.min(23, Math.max(currentHour, 12));
      for (let h = 0; h <= maxHour; h++) {
        const hourStr = `${h.toString().padStart(2, "0")}:00`;
        const matchingOrders = (currentOrders as any[]).filter(o => {
          const od = new Date(o.createdAt);
          return od.getHours() === h;
        });
        const rev = matchingOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        trendData.push({ name: hourStr, revenue: rev, orders: matchingOrders.length });
      }
    } else {
      const points = period === "monthly" ? 30 : 7;
      const interval = 24 * 60 * 60 * 1000;
      for (let i = points - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - (i * interval));
        const dateStr = d.toISOString().split("T")[0];
        const matchingOrders = (currentOrders as any[]).filter(o => {
          const od = new Date(o.createdAt);
          return od.toISOString().split("T")[0] === dateStr;
        });
        const rev = matchingOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        trendData.push({ name: dateStr, revenue: rev, orders: matchingOrders.length });
      }
    }

    // Top Products & Category breakdown
    const productStats: Record<string, { qty: number; revenue: number; name: string; image: string; price: number; category: string }> = {};
    const categoryStats: Record<string, { revenue: number; qty: number }> = {};

    // Use current orders for period stats; if empty, fallback to recent paid orders for sold products
    const ordersToProcess = (currentOrders as any[]).length > 0
      ? (currentOrders as any[])
      : await Order.find(paidOrderFilter).select("amount createdAt items status").limit(100).lean();

    (ordersToProcess as any[]).forEach(order => {
      (order.items || []).forEach((item: any) => {
        const pid = String(item.productId || item._id || item.sku || "unknown");
        const name = item.name || item.title || "Product";
        const image = item.image || "";
        const price = Number(item.price) || 0;
        const qty = Number(item.qty) || 1;
        const cat = item.category || "General";

        if (!productStats[pid]) {
          productStats[pid] = { qty: 0, revenue: 0, name, image, price, category: cat };
        }
        productStats[pid].qty += qty;
        productStats[pid].revenue += (price * qty);

        if (!categoryStats[cat]) categoryStats[cat] = { revenue: 0, qty: 0 };
        categoryStats[cat].revenue += (price * qty);
        categoryStats[cat].qty += qty;
      });
    });

    const allSoldIds = Object.keys(productStats)
      .sort((a, b) => productStats[b].revenue - productStats[a].revenue);

    const topProductIds = allSoldIds.slice(0, 5);
    
    // Batch lookup all top and sold products in one query rather than N sequential finds
    const validIds = allSoldIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const dbTopProducts: any[] = validIds.length > 0
      ? await Product.find({ _id: { $in: validIds } }).select("name image category price stock sku").lean()
      : [];
    const productMap = new Map<string, any>(dbTopProducts.map(p => [p._id.toString(), p]));

    const formatProductItem = (id: string) => {
      const product = productMap.get(id);
      return {
        id,
        name: product ? product.name : (productStats[id]?.name || `Product #${id}`),
        image: product ? product.image : productStats[id]?.image,
        category: product?.category || productStats[id]?.category || "General",
        price: product?.price || productStats[id]?.price || 0,
        sales: productStats[id]?.qty || 0,
        revenue: productStats[id]?.revenue || 0,
        currentStock: product ? product.stock : 0,
        sku: product?.sku || "",
      };
    };

    const topProducts = topProductIds.map(formatProductItem);
    const soldProducts = allSoldIds.map(formatProductItem);

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

    const totalRevenue = totalRevenueAgg?.[0]?.total || 0;
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const dailyRevenue = period === "daily" 
      ? currentRevenue 
      : (currentOrders as any[]).filter(o => new Date(o.createdAt) >= startOfToday).reduce((sum, o) => sum + (o.amount || 0), 0);

    return NextResponse.json({
      summary: {
        totalUsers,
        totalWorkers,
        totalProducts,
        totalOrders,
        dailyRevenue,
        totalRevenue,
        pendingOrders,
        outOfStockCount,
        lowStockCount,
        inStockCount: Math.max(0, totalProducts - outOfStockCount),
      },
      period: {
        revenue: currentRevenue,
        revenueGrowth,
        orders: currentOrderCount,
        orderGrowth,
        newUsers: newUsersCurrent,
        newUserGrowth: calculateGrowth(newUsersCurrent, newUsersPrevious)
      },
      trendData,
      topProducts,
      soldProducts,
      outOfStockProducts: (outOfStockProducts as any[]).map(p => ({
        id: p._id.toString(),
        name: p.name,
        stock: p.stock ?? 0,
        price: p.price,
        image: p.image || "",
        category: p.category || "General",
        sku: p.sku || "",
        updatedAt: p.updatedAt,
      })),
      lowStockProducts: (lowStockProducts as any[]).map(p => ({
        id: p._id.toString(),
        name: p.name,
        stock: p.stock,
        price: p.price,
        image: p.image || "",
        category: p.category || "General",
        sku: p.sku || "",
        updatedAt: p.updatedAt,
      })),
      outOfStockCount,
      lowStockCount,
      categoryDistribution,
    });
  } catch (err: any) {
    console.error("Analytics Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
