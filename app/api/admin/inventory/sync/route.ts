import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { verifyAdmin } from "@/lib/authMiddleware";
import { isStoreApiConfigured, fetchLiveCatalogProducts } from "@/lib/storeApi";
import pusher from "@/lib/pusher";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required!" }, { status: 403 });
    }

    let syncedWithStoreApp = false;
    let storeAppCount = 0;

    // 1. Sync live stock from StoreApp POS if configured
    if (isStoreApiConfigured()) {
      try {
        const liveCatalog = await fetchLiveCatalogProducts({ page: 1, limit: 100 });
        if (liveCatalog && Array.isArray(liveCatalog.products) && liveCatalog.products.length > 0) {
          for (const item of liveCatalog.products) {
            const pIdNum = parseInt(String(item.id).replace(/\D/g, "") || "0", 10);
            const stockQty = typeof item.stock === "number" ? item.stock : 10;
            const isOutOfStock = stockQty <= 0 || item.stockStatus === "Out of Stock" || item.stockStatus === "outofstock";

            await Product.findOneAndUpdate(
              {
                $or: [
                  { storeProductId: String(item.id) },
                  { id: pIdNum },
                  ...(item.sku ? [{ sku: item.sku }] : []),
                  { name: item.name },
                ],
              },
              {
                $set: {
                  stock: stockQty,
                  price: item.price,
                  ...(item.image ? { image: item.image } : {}),
                },
              },
              { upsert: true }
            );
            storeAppCount++;
          }
          syncedWithStoreApp = true;
        }
      } catch (storeErr: any) {
        console.warn("[Inventory Sync] StoreApp POS sync warning:", storeErr.message);
      }
    }

    // 2. Fetch all Out of Stock products (stock <= 0)
    const outOfStockProducts = await Product.find({
      $or: [
        { stock: { $lte: 0 } },
        { stockStatus: { $in: ["Out of Stock", "outofstock"] } },
      ],
    })
      .select("name stock price image category sku storeProductId _id updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    // 3. Fetch Low Stock products (stock > 0 and stock <= 10)
    const lowStockProducts = await Product.find({
      stock: { $gt: 0, $lte: 10 },
      stockStatus: { $nin: ["Out of Stock", "outofstock"] },
    })
      .select("name stock price image category sku storeProductId _id updatedAt")
      .sort({ stock: 1 })
      .lean();

    const totalProducts = await Product.countDocuments();
    const outOfStockCount = outOfStockProducts.length;
    const lowStockCount = lowStockProducts.length;

    // Broadcast sync event to all admin and worker screens via Pusher
    try {
      await pusher.trigger("admin-orders", "stockUpdated", {
        syncedAt: new Date().toISOString(),
        outOfStockCount,
        lowStockCount,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      syncedWithStoreApp,
      storeAppCount,
      counts: {
        total: totalProducts,
        outOfStock: outOfStockCount,
        lowStock: lowStockCount,
        inStock: Math.max(0, totalProducts - outOfStockCount),
      },
      outOfStockProducts: outOfStockProducts.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        stock: p.stock ?? 0,
        price: p.price,
        image: p.image || "",
        category: p.category || "General",
        sku: p.sku || "",
        updatedAt: p.updatedAt,
      })),
      lowStockProducts: lowStockProducts.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        stock: p.stock,
        price: p.price,
        image: p.image || "",
        category: p.category || "General",
        sku: p.sku || "",
        updatedAt: p.updatedAt,
      })),
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Inventory Sync API Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
