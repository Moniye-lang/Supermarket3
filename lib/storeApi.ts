/**
 * STORE & ERP / POS INTEGRATION CLIENT
 * Centralized connector for external Store API endpoints
 */

export interface StoreApiConfig {
  baseUrl: string;
  secret: string;
  key?: string;
}

export interface StoreProduct {
  _id: string;
  id: number | string;
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
  stockTracked: boolean;
  stock: number;
  sku: string;
  category: string;
  categories: { id: number | string; name: string; slug: string }[];
  image: string;
  images: string[];
  createdAt: string;
}

export function getStoreApiConfig(): StoreApiConfig {
  const baseUrl = (process.env.STORE_API_URL || process.env.WOOCOMMERCE_URL || "").trim().replace(/\/$/, "");
  const secret = (process.env.STORE_API_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET || "").trim();
  const key = (process.env.STORE_API_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY || "").trim();
  return { baseUrl, secret, key };
}

export function isStoreApiConfigured(): boolean {
  const { baseUrl, secret, key } = getStoreApiConfig();
  return Boolean(baseUrl && (secret || key));
}

function buildHeaders(): Record<string, string> {
  const { secret, key } = getStoreApiConfig();
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "AMStores-Integration/1.0",
  };

  if (secret && key) {
    const authString = Buffer.from(`${key}:${secret}`).toString("base64");
    headers["Authorization"] = `Basic ${authString}`;
    headers["X-Api-Key"] = secret;
    headers["x-api-key"] = secret;
  } else if (secret) {
    headers["X-Api-Key"] = secret;
    headers["x-api-key"] = secret;
    headers["Authorization"] = `Bearer ${secret}`;
    headers["x-store-secret"] = secret;
  } else if (key) {
    headers["X-Api-Key"] = key;
    headers["x-api-key"] = key;
    headers["Authorization"] = `Bearer ${key}`;
  }

  return headers;
}

async function request<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: any;
    params?: Record<string, string | number | boolean | undefined>;
  } = {}
): Promise<{ success: boolean; data: T; error?: string; status: number }> {
  const { baseUrl } = getStoreApiConfig();

  if (!baseUrl) {
    return {
      success: false,
      data: null as any,
      error: "STORE_API_URL is not configured in .env.local",
      status: 500,
    };
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(`${baseUrl}${cleanEndpoint}`);

  if (options.params) {
    Object.entries(options.params).forEach(([paramKey, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        url.searchParams.set(paramKey, String(val));
      }
    });
  }

  try {
    const res = await fetch(url.toString(), {
      method: options.method || "GET",
      headers: buildHeaders(),
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    const text = await res.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    if (!res.ok) {
      return {
        success: false,
        data: parsed,
        error: typeof parsed === "object" && parsed?.message ? parsed.message : `Request failed with status ${res.status}`,
        status: res.status,
      };
    }

    return {
      success: true,
      data: parsed,
      status: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null as any,
      error: err.message || "Network error connecting to Store API",
      status: 503,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT NORMALIZATION HELPER
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeStoreProduct(p: any): StoreProduct {
  if (!p || typeof p !== "object") return null as any;

  const rawId = p._id || p.id || p.productId || p.sku || String(Math.random());
  const idStr = String(rawId);
  const numericId = typeof p.id === "number" ? p.id : parseInt(idStr.replace(/\D/g, "").slice(-6) || "101", 10);

  const price = parseFloat(p.price || p.regularPrice || p.regular_price || p.unitPrice || "0") || 0;
  const regularPrice = p.regularPrice ? parseFloat(p.regularPrice) : (p.regular_price ? parseFloat(p.regular_price) : (p.oldPrice ? parseFloat(p.oldPrice) : undefined));
  const salePrice = p.salePrice ? parseFloat(p.salePrice) : (p.sale_price ? parseFloat(p.sale_price) : undefined);

  let oldPrice = regularPrice;
  let discount = 0;
  if (regularPrice && regularPrice > price) {
    discount = Math.round(((regularPrice - price) / regularPrice) * 100);
  }

  const stockQty = typeof p.stock === "number" 
    ? p.stock 
    : (typeof p.quantity === "number" ? p.quantity : (typeof p.stock_quantity === "number" ? p.stock_quantity : 10));
  
  const rawStockStatus = String(p.stockStatus || p.stock_status || (stockQty > 0 ? "instock" : "outofstock")).toLowerCase();

  let images: string[] = [];
  if (Array.isArray(p.images)) {
    images = p.images.map((img: any) => (typeof img === "string" ? img : img?.src || img?.url)).filter(Boolean);
  }
  const primaryImage = p.image || p.imageUrl || p.thumbnail || (images.length > 0 ? images[0] : "/placeholder.png");
  if (images.length === 0 && primaryImage) {
    images = [primaryImage];
  }

  let categories: { id: number | string; name: string; slug: string }[] = [];
  let mainCategory = p.category || p.department || "General";
  if (typeof mainCategory === "object" && mainCategory?.name) {
    mainCategory = mainCategory.name;
  }

  if (Array.isArray(p.categories)) {
    categories = p.categories.map((c: any) => ({
      id: c.id || 1,
      name: typeof c === "string" ? c : c.name || "General",
      slug: (typeof c === "string" ? c : c.slug || c.name || "general").toLowerCase().replace(/\s+/g, "-"),
    }));
    if (categories.length > 0 && (!p.category || typeof p.category === "object")) {
      mainCategory = categories[0].name;
    }
  } else {
    categories = [
      {
        id: 1,
        name: String(mainCategory),
        slug: String(mainCategory).toLowerCase().replace(/\s+/g, "-"),
      },
    ];
  }

  return {
    _id: idStr,
    id: numericId,
    name: p.name || p.title || "Product",
    description: p.description || p.shortDescription || p.short_description || "",
    shortDescription: p.shortDescription || p.short_description || (p.description ? p.description.slice(0, 120) : ""),
    price,
    regularPrice,
    salePrice,
    oldPrice,
    onSale: Boolean(p.onSale || p.on_sale || (regularPrice && regularPrice > price)),
    discount,
    stockStatus: rawStockStatus.includes("in") ? "In Stock" : "Out of Stock",
    stockTracked: true,
    stock: stockQty,
    sku: p.sku || `SKU-${idStr.slice(-5).toUpperCase()}`,
    category: String(mainCategory),
    categories,
    image: primaryImage,
    images,
    createdAt: p.createdAt || p.date_created || new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HEALTH (/health)
// ─────────────────────────────────────────────────────────────────────────────
export async function checkHealth() {
  return request("/health", { method: "GET" });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ANALYTICS (/v1/analytics)
// ─────────────────────────────────────────────────────────────────────────────
export async function getAnalytics(params?: { startDate?: string; endDate?: string; period?: string }) {
  return request("/v1/analytics", { method: "GET", params });
}

export async function syncAnalytics(payload?: Record<string, any>) {
  return request("/v1/analytics/sync", { method: "POST", body: payload || {} });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CATALOG (/v1/catalog)
// ─────────────────────────────────────────────────────────────────────────────
export async function getCatalog(params?: { page?: number; limit?: number; search?: string; category?: string }) {
  return request("/v1/catalog", { method: "GET", params });
}

export async function fetchLiveCatalogProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  orderby?: string;
  order?: "asc" | "desc";
}): Promise<{ products: StoreProduct[]; total: number; pages: number; page: number }> {
  const page = params.page || 1;
  const limit = params.limit || 12;

  const res = await getCatalog({
    page,
    limit,
    search: params.search,
    category: params.category && params.category !== "All Departments" ? params.category : undefined,
  });

  if (!res.success || !res.data) {
    throw new Error(res.error || "Failed to fetch catalog from Store API");
  }

  let rawList: any[] = [];
  let totalCount = 0;

  if (Array.isArray(res.data)) {
    rawList = res.data;
    totalCount = res.data.length;
  } else if (res.data && typeof res.data === "object") {
    if (Array.isArray(res.data.products)) rawList = res.data.products;
    else if (Array.isArray(res.data.items)) rawList = res.data.items;
    else if (Array.isArray(res.data.data)) rawList = res.data.data;
    else if (Array.isArray(res.data.catalog)) rawList = res.data.catalog;

    totalCount = res.data.total || res.data.count || rawList.length;
  }

  const products = rawList.map(normalizeStoreProduct).filter(Boolean);
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    products,
    total: totalCount,
    pages: totalPages,
    page,
  };
}

export async function fetchLiveCatalogProductById(productId: string | number): Promise<StoreProduct | null> {
  const res = await getCatalogProduct(productId);
  if (!res.success || !res.data) return null;
  const item = res.data.product || res.data.data || res.data;
  return normalizeStoreProduct(item);
}

export async function getCatalogProduct(productId: string | number) {
  return request(`/v1/catalog/${productId}`, { method: "GET" });
}

export async function getCatalogSyncStatus() {
  return request("/v1/catalog/sync-status", { method: "GET" });
}

export async function syncCatalog(payload?: { fullSync?: boolean; items?: any[] }) {
  return request("/v1/catalog/sync", { method: "POST", body: payload || {} });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CUSTOMERS (/v1/customers)
// ─────────────────────────────────────────────────────────────────────────────
export async function getCustomers(params?: { page?: number; limit?: number; search?: string }) {
  return request("/v1/customers", { method: "GET", params });
}

export async function syncCustomers(payload?: { customers?: any[] }) {
  return request("/v1/customers/sync", { method: "POST", body: payload || {} });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ORDERS (/v1/orders)
// ─────────────────────────────────────────────────────────────────────────────
export async function getOrders(params?: { page?: number; limit?: number; status?: string }) {
  return request("/v1/orders", { method: "GET", params });
}

export async function getOrderById(orderId: string | number) {
  return request(`/v1/orders/${orderId}`, { method: "GET" });
}

export async function createOrder(orderData: Record<string, any>) {
  return request("/v1/orders", { method: "POST", body: orderData });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SALES (/v1/sales)
// ─────────────────────────────────────────────────────────────────────────────
export async function getSales(params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) {
  return request("/v1/sales", { method: "GET", params });
}

export async function syncSales(payload?: { sales?: any[] }) {
  return request("/v1/sales/sync", { method: "POST", body: payload || {} });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. STOCK (/v1/stock)
// ─────────────────────────────────────────────────────────────────────────────
export async function getStock(params?: { page?: number; limit?: number; lowStock?: boolean }) {
  return request("/v1/stock", { method: "GET", params });
}

export async function getStockSyncStatus() {
  return request("/v1/stock/sync-status", { method: "GET" });
}

export async function syncStock(payload?: { stockUpdates?: any[] }) {
  return request("/v1/stock/sync", { method: "POST", body: payload || {} });
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. TRANSACTIONS (/v1/transactions)
// ─────────────────────────────────────────────────────────────────────────────
export async function getTransactions(params?: { page?: number; limit?: number; status?: string }) {
  return request("/v1/transactions", { method: "GET", params });
}

export async function syncTransactions(payload?: { transactions?: any[] }) {
  return request("/v1/transactions/sync", { method: "POST", body: payload || {} });
}
