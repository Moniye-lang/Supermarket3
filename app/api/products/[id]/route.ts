import { NextResponse } from "next/server";
import { fetchWooProductById, updateWooProduct, deleteWooProduct, isWooConfigured, WooProduct } from "@/lib/woocommerce";
import { verifyAdmin } from "@/lib/authMiddleware";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { DEFAULT_PRODUCTS } from "@/lib/defaultProducts";

function normalizeSingleDbProduct(p: any): WooProduct {
  const idStr = p._id ? p._id.toString() : p.id || "1";
  const priceNum = Number(p.price) || 0;
  const stockNum = typeof p.stock === "number" ? p.stock : 10;
  const cat = p.category || "General";

  return {
    _id: idStr,
    id: typeof p.id === "number" ? p.id : parseInt(idStr.replace(/\D/g, "").slice(-6) || "101", 10),
    name: p.name || "Product",
    description: p.description || "",
    shortDescription: p.description ? p.description.slice(0, 120) : "",
    price: priceNum,
    regularPrice: priceNum,
    salePrice: undefined,
    oldPrice: undefined,
    onSale: false,
    discount: 0,
    stockStatus: stockNum > 0 ? "instock" : "outofstock",
    stockTracked: true,
    stock: stockNum,
    sku: p.sku || `SKU-${idStr.slice(-5).toUpperCase()}`,
    category: cat,
    categories: [
      {
        id: 1,
        name: cat,
        slug: cat.toLowerCase().replace(/\s+/g, "-"),
      },
    ],
    image: p.image || "/placeholder.png",
    images: p.image ? [p.image] : [],
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
  };
}

// GET single product by ID (WooCommerce API with DB backup)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // 1. Try WooCommerce if configured
    if (isWooConfigured()) {
      try {
        const product = await fetchWooProductById(id);
        if (product) {
          return NextResponse.json(product);
        }
      } catch (err: any) {
        console.warn("[Products API] WooCommerce single product fetch error, falling back to DB:", err.message);
      }
    }

    // 2. Database Backup: Try MongoDB
    try {
      await dbConnect();
      let dbProduct = null;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        dbProduct = await Product.findById(id).lean();
      } else {
        dbProduct = await Product.findOne({ $or: [{ _id: id }, { name: { $regex: new RegExp(`^${id}$`, "i") } }] }).lean();
      }

      if (dbProduct) {
        return NextResponse.json(normalizeSingleDbProduct(dbProduct));
      }
    } catch (dbErr: any) {
      console.warn("[Products API] DB lookup error:", dbErr.message);
    }

    // 3. Fallback catalog lookup
    const fallbackItem = DEFAULT_PRODUCTS.find((p) => p.id === id || p.name.toLowerCase() === decodeURIComponent(id).toLowerCase());
    if (fallbackItem) {
      return NextResponse.json(
        normalizeSingleDbProduct({
          _id: fallbackItem.id,
          id: fallbackItem.id,
          name: fallbackItem.name,
          price: fallbackItem.price,
          category: fallbackItem.category,
          image: fallbackItem.image,
          description: fallbackItem.description,
          stock: fallbackItem.stock,
        })
      );
    }

    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  } catch (err: any) {
    console.error("Error in GET /api/products/[id]:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// PUT: Update a product (admin only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, price, salePrice, stock, sku, categoryId, imageUrl } = body;

    let updatedWoo = null;
    if (isWooConfigured()) {
      try {
        const payload: Record<string, any> = {};
        if (name !== undefined) payload.name = name;
        if (description !== undefined) payload.description = description;
        if (price !== undefined) payload.regular_price = String(price);
        if (salePrice !== undefined) payload.sale_price = salePrice ? String(salePrice) : "";
        if (sku !== undefined) payload.sku = sku;
        if (stock !== undefined) {
          payload.stock_quantity = Number(stock);
          payload.manage_stock = true;
          payload.stock_status = Number(stock) > 0 ? "instock" : "outofstock";
        }
        if (categoryId !== undefined) payload.categories = [{ id: Number(categoryId) }];
        if (imageUrl !== undefined) payload.images = imageUrl ? [{ src: imageUrl }] : [];

        updatedWoo = await updateWooProduct(id, payload);
      } catch (err: any) {
        console.warn("[Products API] WooCommerce update error:", err.message);
      }
    }

    // Also update in MongoDB if present
    try {
      await dbConnect();
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (price) updateData.price = Number(price);
      if (stock !== undefined) updateData.stock = Number(stock);
      if (imageUrl) updateData.image = imageUrl;

      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await Product.findByIdAndUpdate(id, updateData);
      }
    } catch {}

    return NextResponse.json({ success: true, product: updatedWoo || { id, ...body } });
  } catch (err: any) {
    console.error("Error in PUT /api/products/[id]:", err);
    return NextResponse.json({ error: err.message || "Failed to update product" }, { status: 500 });
  }
}

// DELETE: Permanently delete a product (admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    if (isWooConfigured()) {
      try {
        await deleteWooProduct(id);
      } catch (err: any) {
        console.warn("[Products API] WooCommerce delete error:", err.message);
      }
    }

    try {
      await dbConnect();
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        await Product.findByIdAndDelete(id);
      }
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/products/[id]:", err);
    return NextResponse.json({ error: err.message || "Failed to delete product" }, { status: 500 });
  }
}
