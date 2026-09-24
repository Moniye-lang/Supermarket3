import { NextResponse } from "next/server";
import { fetchWooProducts, createWooProduct, isWooConfigured, WooProduct } from "@/lib/woocommerce";
import { isStoreApiConfigured, fetchLiveCatalogProducts } from "@/lib/storeApi";
import { verifyAdmin } from "@/lib/authMiddleware";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { DEFAULT_PRODUCTS, DefaultProductItem } from "@/lib/defaultProducts";

function normalizeDbProduct(p: any): WooProduct {
  const idStr = p._id ? p._id.toString() : p.id || Math.random().toString();
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

// Fetch products from database (with fallback to default items if DB connection fails)
async function fetchDbProducts(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  orderby?: string;
  order?: "asc" | "desc";
}): Promise<{ products: WooProduct[]; total: number; pages: number; page: number; source: string }> {
  const { page, limit, search, category, orderby, order } = params;

  try {
    await dbConnect();

    // Auto-seed if collection is completely empty
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(DEFAULT_PRODUCTS);
    }

    const filter: any = {};
    if (category && category !== "All Departments") {
      filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    }
    if (search && search.trim()) {
      const qRegex = { $regex: search.trim(), $options: "i" };
      filter.$or = [{ name: qRegex }, { description: qRegex }, { category: qRegex }];
    }

    const sortOptions: any = {};
    if (orderby === "price") {
      sortOptions.price = order === "desc" ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }

    const total = await Product.countDocuments(filter);
    const rawProducts = await Product.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const products = rawProducts.map(normalizeDbProduct);

    return {
      products,
      total,
      pages: Math.ceil(total / limit) || 1,
      page,
      source: "database",
    };
  } catch (dbErr: any) {
    console.warn("[Products API] MongoDB query error, using in-memory catalog fallback:", dbErr.message);

    // Tertiary Fallback: Filter in-memory default products
    let items = [...DEFAULT_PRODUCTS];
    if (category && category !== "All Departments") {
      items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }
    if (search && search.trim()) {
      const s = search.toLowerCase().trim();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(s) || i.description.toLowerCase().includes(s) || i.category.toLowerCase().includes(s)
      );
    }
    if (orderby === "price") {
      items.sort((a, b) => (order === "desc" ? b.price - a.price : a.price - b.price));
    }

    const total = items.length;
    const paginated = items.slice((page - 1) * limit, page * limit);
    const products = paginated.map((item) =>
      normalizeDbProduct({
        _id: item.id,
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        image: item.image,
        description: item.description,
        stock: item.stock,
      })
    );

    return {
      products,
      total,
      pages: Math.ceil(total / limit) || 1,
      page,
      source: "in-memory-backup",
    };
  }
}

// GET products: Uses WooCommerce API if configured in .env, otherwise automatically falls back to DB
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

    // 1. If Store API is configured, fetch live catalog from GET /v1/catalog
    if (isStoreApiConfigured()) {
      try {
        const catalogResult = await fetchLiveCatalogProducts({ page, limit, search: q, category, orderby, order });
        if (catalogResult && Array.isArray(catalogResult.products) && catalogResult.products.length > 0) {
          return NextResponse.json(
            { ...catalogResult, source: "store_api" },
            {
              headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
              },
            }
          );
        }
      } catch (storeErr: any) {
        console.warn("[Products API] Store API live catalog fetch error, falling back to backup:", storeErr.message);
      }
    }

    // 1b. Fallback to WooCommerce if configured
    if (isWooConfigured()) {
      try {
        const wooResult = await fetchWooProducts({ page, limit, search: q, category, orderby, order });
        if (wooResult && Array.isArray(wooResult.products) && wooResult.products.length > 0) {
          return NextResponse.json(
            { ...wooResult, source: "woocommerce" },
            {
              headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
              },
            }
          );
        }
      } catch (wooErr: any) {
        console.warn("[Products API] WooCommerce fetch failed, falling back to DB backup:", wooErr.message);
      }
    }

    // 2. Database Backup: Fetch from MongoDB (or fallback catalog)
    const dbResult = await fetchDbProducts({ page, limit, search: q, category, orderby, order });
    return NextResponse.json(dbResult, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (err: any) {
    console.error("Error in GET /api/products:", err);
    return NextResponse.json(
      { error: "Failed to fetch products", products: [], total: 0, pages: 1, page: 1 },
      { status: 500 }
    );
  }
}

// POST: Create product in WooCommerce if configured, and in MongoDB database
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

    let wooProduct = null;
    if (isWooConfigured()) {
      try {
        const payload: any = {
          name,
          description: description || "",
          regular_price: String(price),
          sku: sku || "",
          stock_quantity: stock !== undefined ? Number(stock) : undefined,
          manage_stock: stock !== undefined,
          stock_status: stock === undefined || Number(stock) > 0 ? "instock" : "outofstock",
        };

        if (salePrice) payload.sale_price = String(salePrice);
        if (categoryId) payload.categories = [{ id: Number(categoryId) }];
        if (imageUrl) payload.images = [{ src: imageUrl }];

        wooProduct = await createWooProduct(payload);
      } catch (wooErr: any) {
        console.warn("[Products API] WooCommerce create failed, saving to DB only:", wooErr.message);
      }
    }

    // Always save to database as well
    try {
      await dbConnect();
      const newProduct = await Product.create({
        name,
        description: description || "",
        price: Number(price),
        stock: Number(stock) || 0,
        category: category || "General",
        image: imageUrl || "",
      });
      return NextResponse.json(
        { success: true, product: wooProduct || normalizeDbProduct(newProduct) },
        { status: 201 }
      );
    } catch {
      return NextResponse.json(
        { success: true, product: wooProduct || { name, price, stock } },
        { status: 201 }
      );
    }
  } catch (err: any) {
    console.error("Error in POST /api/products:", err);
    return NextResponse.json({ error: err.message || "Failed to create product" }, { status: 500 });
  }
}
