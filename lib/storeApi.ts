/**
 * STOREAPP INTEGRATION API CLIENT (v1)
 * Official client for StoreApp Merchant API
 * Base URL: https://st-epi-dev.azurewebsites.net
 */

export interface StoreAppConfig {
  baseUrl: string;
  apiKey: string;
  tenantId?: string;
}

export interface StoreAppCatalogProduct {
  productId: number;
  name: string;
  sku: string;
  genericName?: string;
  brand?: string;
  brandId?: number;
  category: string;
  price: number;
  unit?: string;
  inStock: boolean;
  stockQuantity: number;
  imageUrl?: string | null;
  isBrandDefault?: boolean;
  attributes?: { name: string; value: string }[];
  syncedAt?: string;
}

export interface NormalizedStoreProduct {
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
  stockTracked: boolean;
  stock: number;
  sku: string;
  category: string;
  categories: { id: number; name: string; slug: string }[];
  image: string;
  images: string[];
  brand?: string;
  unit?: string;
  attributes?: { name: string; value: string }[];
  createdAt: string;
}

export function getStoreApiConfig(): StoreAppConfig {
  const baseUrl = (
    process.env.STORE_API_URL ||
    process.env.STOREAPP_API_URL ||
    "https://st-epi-dev.azurewebsites.net"
  ).trim().replace(/\/$/, "");

  const apiKey = (
    process.env.STORE_API_SECRET ||
    process.env.STORE_API_KEY ||
    process.env.STOREAPP_API_KEY ||
    ""
  ).trim();

  const tenantId = (
    process.env.STORE_API_TENANT_ID ||
    process.env.STOREAPP_TENANT_ID ||
    ""
  ).trim();

  return { baseUrl, apiKey, tenantId };
}

export function isStoreApiConfigured(): boolean {
  const { baseUrl, apiKey } = getStoreApiConfig();
  return Boolean(baseUrl && apiKey);
}

function buildHeaders(): Record<string, string> {
  const { apiKey, tenantId } = getStoreApiConfig();
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "AMStores-StoreApp-Integration/1.0",
  };

  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
    headers["x-api-key"] = apiKey;
  }

  if (tenantId) {
    headers["X-Tenant-Id"] = tenantId;
    headers["Tenant-Id"] = tenantId;
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
  const { baseUrl, apiKey } = getStoreApiConfig();

  if (!apiKey) {
    return {
      success: false,
      data: null as any,
      error: "STORE_API_SECRET (X-Api-Key) is not configured in .env.local",
      status: 401,
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
      error: err.message || "Network error connecting to StoreApp Integration API",
      status: 503,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT NORMALIZATION ACCORDING TO STOREAPP SPEC
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeStoreProduct(p: any): NormalizedStoreProduct {
  if (!p || typeof p !== "object") return null as any;

  const rawId = p.productId ?? p.id ?? p._id ?? p.sku ?? Math.floor(Math.random() * 10000);
  const numericId = typeof rawId === "number" ? rawId : parseInt(String(rawId).replace(/\D/g, "").slice(-6) || "101", 10);
  const idStr = String(numericId);

  const price = typeof p.price === "number" ? p.price : parseFloat(p.price || "0") || 0;
  const stockQty = typeof p.stockQuantity === "number" 
    ? p.stockQuantity 
    : (typeof p.stock === "number" ? p.stock : (p.inStock ? 50 : 0));
  
  const inStock = p.inStock ?? (stockQty > 0);
  const image = p.imageUrl || p.image || "/placeholder.png";
  const categoryName = p.category || p.genericName || "General";

  const description = p.genericName 
    ? `${p.name} - ${p.genericName} (${p.unit || "Unit"}). ${p.brand ? `Brand: ${p.brand}.` : ""}`
    : `${p.name} (${p.unit || "Unit"}). ${p.brand ? `Brand: ${p.brand}.` : ""}`;

  return {
    _id: idStr,
    id: numericId,
    name: p.name || "Product",
    description,
    shortDescription: description.slice(0, 120),
    price,
    regularPrice: price,
    salePrice: undefined,
    oldPrice: undefined,
    onSale: false,
    discount: 0,
    stockStatus: inStock ? "In Stock" : "Out of Stock",
    stockTracked: true,
    stock: stockQty,
    sku: p.sku || `SKU-${numericId}`,
    category: categoryName,
    categories: [
      {
        id: p.brandId || 1,
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
      },
    ],
    image,
    images: [image],
    brand: p.brand,
    unit: p.unit,
    attributes: p.attributes || [],
    createdAt: p.syncedAt || new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HEALTH (/health)
// ─────────────────────────────────────────────────────────────────────────────
export async function checkHealth() {
  return request("/health", { method: "GET" });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CATALOG (/v1/catalog)
// ─────────────────────────────────────────────────────────────────────────────
export async function getCatalog(params?: {
  search?: string;
  brand?: string;
  brandId?: number;
  category?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  pageSize?: number;
  continuationToken?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams: Record<string, any> = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.brand) queryParams.brand = params.brand;
  if (params?.brandId) queryParams.brandId = params.brandId;
  if (params?.category) queryParams.category = params.category;
  if (params?.inStock !== undefined) queryParams.inStock = params.inStock;
  if (params?.minPrice) queryParams.minPrice = params.minPrice;
  if (params?.maxPrice) queryParams.maxPrice = params.maxPrice;
  if (params?.pageSize || params?.limit) queryParams.pageSize = params?.pageSize || params?.limit;
  if (params?.continuationToken) queryParams.continuationToken = params.continuationToken;

  return request("/v1/catalog", { method: "GET", params: queryParams });
}

export async function fetchLiveCatalogProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  orderby?: string;
  order?: "asc" | "desc";
}): Promise<{ products: NormalizedStoreProduct[]; total: number; pages: number; page: number; continuationToken?: string }> {
  const page = params.page || 1;
  const limit = params.limit || 50;

  const res = await getCatalog({
    search: params.search,
    category: params.category && params.category !== "All Departments" ? params.category : undefined,
    pageSize: limit,
  });

  if (!res.success || !res.data) {
    throw new Error(res.error || "Failed to fetch catalog from StoreApp Integration API");
  }

  const envelope = res.data;
  let rawList: any[] = [];
  let totalCount = 0;
  let continuationToken: string | undefined = undefined;

  if (Array.isArray(envelope)) {
    rawList = envelope;
    totalCount = envelope.length;
  } else if (envelope && typeof envelope === "object") {
    if (Array.isArray(envelope.products)) rawList = envelope.products;
    else if (Array.isArray(envelope.data)) rawList = envelope.data;
    else if (Array.isArray(envelope.items)) rawList = envelope.items;

    totalCount = envelope.totalCount || envelope.total || rawList.length;
    continuationToken = envelope.continuationToken || undefined;
  }

  const products = rawList.map(normalizeStoreProduct).filter(Boolean);
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    products,
    total: totalCount,
    pages: totalPages,
    page,
    continuationToken,
  };
}

export async function getCatalogProduct(productId: string | number) {
  return request(`/v1/catalog/${productId}`, { method: "GET" });
}

export async function fetchLiveCatalogProductById(productId: string | number): Promise<NormalizedStoreProduct | null> {
  const res = await getCatalogProduct(productId);
  if (!res.success || !res.data) return null;
  const item = res.data.product || res.data.data || res.data;
  return normalizeStoreProduct(item);
}

export async function getCatalogSyncStatus() {
  return request("/v1/catalog/sync-status", { method: "GET" });
}

export async function syncCatalog(payload?: { fullSync?: boolean; items?: any[] }) {
  return request("/v1/catalog/sync", { method: "POST", body: payload || {} });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ORDERS (/v1/orders) - POS Real-time Submission
// ─────────────────────────────────────────────────────────────────────────────
export async function createOrder(orderPayload: {
  externalRef: string;
  storeId: number;
  customerId?: number;
  customerName?: string;
  items: { productId: number; quantity: number; unitPrice: number; discount?: number }[];
  payments: { mode: "cash" | "card" | "bank" | "online"; amount: number; reference?: string }[];
  comments?: string;
  webhookUrl?: string;
}) {
  return request("/v1/orders", { method: "POST", body: orderPayload });
}

export async function getOrders(params?: { status?: string; page?: number; pageSize?: number }) {
  return request("/v1/orders", { method: "GET", params });
}

export async function getOrderById(orderId: string | number) {
  return request(`/v1/orders/${orderId}`, { method: "GET" });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. STOCK (/v1/stock)
// ─────────────────────────────────────────────────────────────────────────────
export async function getStock(params?: { outletId?: number; inStock?: boolean; search?: string }) {
  return request("/v1/stock", { method: "GET", params });
}

export async function getStockSyncStatus() {
  return request("/v1/stock/sync-status", { method: "GET" });
}

export async function syncStock(payload?: { stockUpdates?: any[] }) {
  return request("/v1/stock/sync", { method: "POST", body: payload || {} });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SALES (/v1/sales)
// ─────────────────────────────────────────────────────────────────────────────
export async function getSales(params?: {
  from?: string;
  to?: string;
  customerId?: number;
  paymentMode?: string;
  saleType?: string;
  page?: number;
  pageSize?: number;
}) {
  return request("/v1/sales", { method: "GET", params });
}

export async function syncSales(payload?: { sales?: any[] }) {
  return request("/v1/sales/sync", { method: "POST", body: payload || {} });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CUSTOMERS (/v1/customers)
// ─────────────────────────────────────────────────────────────────────────────
export async function getCustomers(params?: { search?: string; page?: number; pageSize?: number }) {
  return request("/v1/customers", { method: "GET", params });
}

export async function syncCustomers(payload?: { customers?: any[] }) {
  return request("/v1/customers/sync", { method: "POST", body: payload || {} });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ANALYTICS (/v1/analytics)
// ─────────────────────────────────────────────────────────────────────────────
export async function getAnalytics(params?: {
  from?: string;
  to?: string;
  groupBy?: "day" | "week" | "month";
  outletId?: number;
}) {
  return request("/v1/analytics", { method: "GET", params });
}

export async function syncAnalytics(payload?: Record<string, any>) {
  return request("/v1/analytics/sync", { method: "POST", body: payload || {} });
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. TRANSACTIONS (/v1/transactions)
// ─────────────────────────────────────────────────────────────────────────────
export async function getTransactions(params?: {
  from?: string;
  to?: string;
  status?: string;
  transactionType?: string;
  paymentMethod?: string;
  page?: number;
  pageSize?: number;
}) {
  return request("/v1/transactions", { method: "GET", params });
}

export async function syncTransactions(payload?: { transactions?: any[] }) {
  return request("/v1/transactions/sync", { method: "POST", body: payload || {} });
}
