import { NextResponse } from "next/server";
import { fetchWooProducts } from "@/lib/woocommerce";

// GET products from WooCommerce REST API (supports pagination, search, category, sorting)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 12;
    const category = searchParams.get("category") || undefined;
    const q = searchParams.get("q") || searchParams.get("search") || undefined;
    const sort = searchParams.get("sort") || undefined;

    let orderby: string | undefined = undefined;
    let order: "asc" | "desc" | undefined = undefined;

    if (sort === "price-low") {
      orderby = "price";
      order = "asc";
    } else if (sort === "price-high") {
      orderby = "price";
      order = "desc";
    } else if (sort === "newest") {
      orderby = "date";
      order = "desc";
    }

    const result = await fetchWooProducts({
      page,
      limit,
      search: q,
      category,
      orderby,
      order,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error in GET /api/products:", err);
    return NextResponse.json(
      { error: "Failed to fetch products from WooCommerce", products: [], total: 0, pages: 1, page: 1 },
      { status: 500 }
    );
  }
}
