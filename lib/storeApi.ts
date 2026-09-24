/**
 * STORE & ERP / POS INTEGRATION CLIENT
 * Centralized connector for external Store API endpoints
 */

export interface StoreApiConfig {
  baseUrl: string;
  secret: string;
  key?: string;
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
  } else if (secret) {
    headers["Authorization"] = `Bearer ${secret}`;
    headers["x-api-key"] = secret;
    headers["x-store-secret"] = secret;
  } else if (key) {
    headers["Authorization"] = `Bearer ${key}`;
    headers["x-api-key"] = key;
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
