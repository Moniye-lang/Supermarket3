import { NextResponse } from "next/server";
import { fetchWooProductById } from "@/lib/woocommerce";

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
