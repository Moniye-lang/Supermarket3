import { NextResponse } from "next/server";
import { fetchWooCategories } from "@/lib/woocommerce";

// GET product categories from WooCommerce
export async function GET() {
  try {
    const categories = await fetchWooCategories();
    return NextResponse.json({ categories });
  } catch (err: any) {
    console.error("Error in GET /api/products/categories:", err);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}
