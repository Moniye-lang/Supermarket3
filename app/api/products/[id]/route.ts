import { NextResponse } from "next/server";
import { fetchWooProductById, updateWooProduct, deleteWooProduct } from "@/lib/woocommerce";
import { verifyAdmin } from "@/lib/authMiddleware";

// GET single product by ID from WooCommerce
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }
    const product = await fetchWooProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (err: any) {
    console.error("Error in GET /api/products/[id]:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// PUT: Update a product in WooCommerce (admin only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, price, salePrice, stock, sku, categoryId, imageUrl } = body;

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

    const product = await updateWooProduct(id, payload);
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error("Error in PUT /api/products/[id]:", err);
    return NextResponse.json({ error: err.message || "Failed to update product" }, { status: 500 });
  }
}

// DELETE: Permanently delete a product from WooCommerce (admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    await deleteWooProduct(id);
    return NextResponse.json({ success: true, message: `Product ${id} deleted from WooCommerce` });
  } catch (err: any) {
    console.error("Error in DELETE /api/products/[id]:", err);
    return NextResponse.json({ error: err.message || "Failed to delete product" }, { status: 500 });
  }
}
