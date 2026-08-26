import { NextResponse } from "next/server";
import { fetchWooProducts, createWooProduct } from "@/lib/woocommerce";
import { verifyAdmin } from "@/lib/authMiddleware";

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

    const result = await fetchWooProducts({ page, limit, search: q, category, orderby, order });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    console.error("Error in GET /api/products:", err);
    return NextResponse.json(
      { error: "Failed to fetch products from WooCommerce", products: [], total: 0, pages: 1, page: 1 },
      { status: 500 }
    );
  }
}

// POST: Create a new product in WooCommerce (admin only)
export async function POST(req: Request) {
  try {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, price, salePrice, stock, sku, category, categoryId, imageUrl } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const payload: any = {
      name,
      description: description || "",
      regular_price: String(price),
      sku: sku || "",
      stock_quantity: stock !== undefined ? Number(stock) : undefined,
      manage_stock: stock !== undefined,
      stock_status: (stock === undefined || Number(stock) > 0) ? "instock" : "outofstock",
    };

    if (salePrice) payload.sale_price = String(salePrice);
    if (categoryId) payload.categories = [{ id: Number(categoryId) }];
    if (imageUrl) payload.images = [{ src: imageUrl }];

    const product = await createWooProduct(payload);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: any) {
    console.error("Error in POST /api/products:", err);
    return NextResponse.json({ error: err.message || "Failed to create product" }, { status: 500 });
  }
}
