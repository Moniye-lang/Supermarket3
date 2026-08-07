export interface WooProduct {
  _id: string;
  id: number;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  regularPrice?: number;
  salePrice?: number;
  oldPrice?: number;
  onSale: boolean;
  discount?: number;
  stockStatus: string;
  stock: number;
  sku: string;
  category: string;
  categories: { id: number; name: string; slug: string }[];
  image: string;
  images: string[];
  createdAt: string;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

const WOOCOMMERCE_URL = (process.env.WOOCOMMERCE_URL || "https://wc.agbenimercantilestores.com").replace(/\/$/, "");
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || "";
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || "";

// Simple in-memory cache for API calls to prevent unnecessary external requests
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }
  return null;
}

function setCachedData(key: string, data: any): void {
  cache.set(key, { timestamp: Date.now(), data });
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
}

export function normalizeWooProduct(p: any): WooProduct {
  const price = parseFloat(p.price || p.regular_price || "0");
  const regularPrice = p.regular_price ? parseFloat(p.regular_price) : undefined;
  const salePrice = p.sale_price ? parseFloat(p.sale_price) : undefined;
  
  let oldPrice: number | undefined = undefined;
  let discount: number | undefined = undefined;
  
  if (regularPrice && regularPrice > price) {
    oldPrice = regularPrice;
    discount = Math.round(((regularPrice - price) / regularPrice) * 100);
  }

  const images = Array.isArray(p.images) ? p.images.map((img: any) => img.src).filter(Boolean) : [];
  const primaryImage = images.length > 0 ? images[0] : (typeof p.image === "string" ? p.image : "");

  const categories = Array.isArray(p.categories) 
    ? p.categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))
    : [];
  const mainCategory = categories.length > 0 ? categories[0].name : "General";

  const isInstock = p.stock_status === "instock";
  const stockQty = typeof p.stock_quantity === "number" 
    ? p.stock_quantity 
    : (isInstock ? 99 : 0);

  return {
    _id: String(p.id),
    id: p.id,
    name: p.name || "",
    description: stripHtml(p.description || p.short_description || ""),
    shortDescription: stripHtml(p.short_description || ""),
    price: price,
    regularPrice: regularPrice,
    salePrice: salePrice,
    oldPrice: oldPrice,
    onSale: Boolean(p.on_sale),
    discount: discount,
    stockStatus: isInstock ? "In Stock" : "Out of Stock",
    stock: stockQty,
    sku: p.sku || "",
    category: mainCategory,
    categories: categories,
    image: primaryImage,
    images: images.length > 0 ? images : [primaryImage].filter(Boolean),
    createdAt: p.date_created || new Date().toISOString(),
  };
}

async function wooFetch(endpoint: string, params: Record<string, string | number> = {}): Promise<{ data: any; headers: Headers }> {
  const url = new URL(`${WOOCOMMERCE_URL}/wp-json/wc/v3${endpoint}`);
  
  // Attach credentials as query params & authorization header for server compatibility
  if (CONSUMER_KEY) url.searchParams.set("consumer_key", CONSUMER_KEY);
  if (CONSUMER_SECRET) url.searchParams.set("consumer_secret", CONSUMER_SECRET);

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      url.searchParams.set(key, String(val));
    }
  });

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "User-Agent": "AMStores-NextJS/1.0",
  };

  if (CONSUMER_KEY && CONSUMER_SECRET) {
    const authString = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
    headers["Authorization"] = `Basic ${authString}`;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
    next: { revalidate: 300 }, // 5 min revalidation for Next.js fetch cache
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`WooCommerce API Error [${response.status}] for ${endpoint}:`, errorText);
    throw new Error(`WooCommerce API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return { data, headers: response.headers };
}

export async function fetchWooProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  order?: "asc" | "desc";
  orderby?: string;
}): Promise<{ products: WooProduct[]; total: number; pages: number; page: number }> {
  const page = params.page || 1;
  const limit = params.limit || 12;
  const cacheKey = `products_${page}_${limit}_${params.search || ""}_${params.category || ""}_${params.orderby || ""}_${params.order || ""}`;

  const cached = getCachedData<{ products: WooProduct[]; total: number; pages: number; page: number }>(cacheKey);
  if (cached) return cached;

  const queryParams: Record<string, string | number> = {
    page,
    per_page: limit,
  };

  if (params.search) queryParams.search = params.search;
  if (params.category && params.category !== "All Departments") {
    // If category is a number string (category ID), use category param
    if (!isNaN(Number(params.category))) {
      queryParams.category = params.category;
    }
  }
  if (params.orderby) queryParams.orderby = params.orderby;
  if (params.order) queryParams.order = params.order;

  try {
    const { data, headers } = await wooFetch("/products", queryParams);
    
    const total = parseInt(headers.get("x-wp-total") || "0", 10) || (Array.isArray(data) ? data.length : 0);
    const pages = parseInt(headers.get("x-wp-totalpages") || "1", 10) || Math.ceil(total / limit) || 1;

    const products = Array.isArray(data) ? data.map(normalizeWooProduct) : [];
    
    // If category was specified by name instead of ID, filter client-side if needed
    let filteredProducts = products;
    if (params.category && params.category !== "All Departments" && isNaN(Number(params.category))) {
      const lowerCat = params.category.toLowerCase();
      filteredProducts = products.filter(p => 
        p.category.toLowerCase() === lowerCat || 
        p.categories.some(c => c.name.toLowerCase() === lowerCat || c.slug.toLowerCase() === lowerCat)
      );
    }

    const result = {
      products: filteredProducts,
      total: total,
      pages: pages,
      page: page,
    };

    setCachedData(cacheKey, result);
    return result;
  } catch (err: any) {
    console.error("Failed to fetch products from WooCommerce:", err.message);
    return { products: [], total: 0, pages: 1, page: page };
  }
}

export async function fetchWooProductById(id: string): Promise<WooProduct | null> {
  const cacheKey = `product_${id}`;
  const cached = getCachedData<WooProduct>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await wooFetch(`/products/${id}`);
    if (!data || !data.id) return null;
    
    const product = normalizeWooProduct(data);
    setCachedData(cacheKey, product);
    return product;
  } catch (err: any) {
    console.error(`Failed to fetch WooCommerce product ID ${id}:`, err.message);
    return null;
  }
}

export async function fetchWooCategories(): Promise<WooCategory[]> {
  const cacheKey = "categories_list";
  const cached = getCachedData<WooCategory[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await wooFetch("/products/categories", { per_page: 100, hide_empty: "true" });
    if (!Array.isArray(data)) return [];

    const categories: WooCategory[] = data.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c.count || 0,
    }));

    setCachedData(cacheKey, categories);
    return categories;
  } catch (err: any) {
    console.error("Failed to fetch WooCommerce categories:", err.message);
    return [];
  }
}
