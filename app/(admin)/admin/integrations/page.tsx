"use client";

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  Activity,
  Package,
  Layers,
  ShoppingCart,
  Users,
  TrendingUp,
  CreditCard,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HealthStatus {
  configured: boolean;
  baseUrl?: string;
  healthy?: boolean;
  latencyMs?: number;
  status?: number;
  response?: any;
  error?: string;
}

export default function AdminIntegrationsPage() {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<
    "health" | "catalog" | "stock" | "orders" | "customers" | "sales" | "transactions" | "analytics"
  >("health");

  // Health state
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Tab Data State
  const [tabData, setTabData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [productIdInput, setProductIdInput] = useState("");
  const [orderIdInput, setOrderIdInput] = useState("");

  const getHeaders = () => {
    const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : "");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentToken}`,
    };
  };

  const checkHealthStatus = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/admin/integrations/health", { headers: getHeaders() });
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      setHealth({
        configured: false,
        healthy: false,
        error: err.message || "Failed to reach health endpoint",
      });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkHealthStatus();
  }, [token]);

  const loadTabData = async (tab: string) => {
    setLoadingData(true);
    setSyncResult(null);
    try {
      let url = "";
      if (tab === "catalog") url = "/api/admin/integrations/catalog";
      else if (tab === "stock") url = "/api/admin/integrations/stock";
      else if (tab === "orders") url = "/api/admin/integrations/orders";
      else if (tab === "customers") url = "/api/admin/integrations/customers";
      else if (tab === "sales") url = "/api/admin/integrations/sales";
      else if (tab === "transactions") url = "/api/admin/integrations/transactions";
      else if (tab === "analytics") url = "/api/admin/integrations/analytics";

      if (url) {
        const res = await fetch(url, { headers: getHeaders() });
        const data = await res.json();
        setTabData(data);
      }
    } catch (err: any) {
      setTabData({ error: err.message || "Failed to load data" });
    } finally {
      setLoadingData(false);
    }
  };

  const triggerSync = async (endpoint: string) => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/admin/integrations/${endpoint}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ triggeredAt: new Date().toISOString(), manual: true }),
      });
      const data = await res.json();
      setSyncResult(data);
      loadTabData(activeTab);
    } catch (err: any) {
      setSyncResult({ error: err.message || "Sync request failed" });
    } finally {
      setSyncing(false);
    }
  };

  const fetchSingleProduct = async () => {
    if (!productIdInput.trim()) return;
    setLoadingData(true);
    try {
      const res = await fetch(`/api/admin/integrations/catalog/${encodeURIComponent(productIdInput.trim())}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      setTabData(data);
    } catch (err: any) {
      setTabData({ error: err.message });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchSingleOrder = async () => {
    if (!orderIdInput.trim()) return;
    setLoadingData(true);
    try {
      const res = await fetch(`/api/admin/integrations/orders/${encodeURIComponent(orderIdInput.trim())}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      setTabData(data);
    } catch (err: any) {
      setTabData({ error: err.message });
    } finally {
      setLoadingData(false);
    }
  };

  const tabs = [
    { id: "health", label: "Health", icon: Activity, badge: "GET /health" },
    { id: "catalog", label: "Catalog", icon: Package, badge: "/v1/catalog" },
    { id: "stock", label: "Stock", icon: Layers, badge: "/v1/stock" },
    { id: "orders", label: "Orders", icon: ShoppingCart, badge: "/v1/orders" },
    { id: "customers", label: "Customers", icon: Users, badge: "/v1/customers" },
    { id: "sales", label: "Sales", icon: TrendingUp, badge: "/v1/sales" },
    { id: "transactions", label: "Transactions", icon: CreditCard, badge: "/v1/transactions" },
    { id: "analytics", label: "Analytics", icon: BarChart3, badge: "/v1/analytics" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-display">Store &amp; ERP Integrations</h1>
            <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Live API Gateway
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Manage, test, and synchronize your catalog, stock, orders, and telemetry with your external Store API.
          </p>
        </div>

        <button
          onClick={checkHealthStatus}
          disabled={healthLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <RefreshCw size={16} className={healthLoading ? "animate-spin" : ""} />
          {healthLoading ? "Pinging..." : "Test Connection"}
        </button>
      </div>

      {/* Integration Overview Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              health?.healthy
                ? "bg-emerald-50 text-emerald-600"
                : health?.configured
                ? "bg-amber-50 text-amber-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {health?.healthy ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">API Status</p>
            <p className="text-lg font-bold text-gray-900">
              {health?.healthy ? "Connected & Online" : health?.configured ? "Endpoint Error" : "Not Configured"}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Latency / Ping</p>
            <p className="text-lg font-bold text-gray-900">
              {health?.latencyMs !== undefined ? `${health.latencyMs} ms` : "—"}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Endpoint</p>
            <p className="text-sm font-bold text-gray-900 truncate">
              {health?.baseUrl || "STORE_API_URL in .env.local"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id !== "health") {
                  loadTabData(tab.id);
                }
              }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer border ${
                isActive
                  ? "bg-brand-dark text-white border-brand-dark shadow-md"
                  : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {activeTab === "health" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Health Endpoint: GET /health</h2>
                <p className="text-sm text-gray-500">Live heartbeat check verifying connectivity and response.</p>
              </div>
              <button
                onClick={checkHealthStatus}
                disabled={healthLoading}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {healthLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Ping /health
              </button>
            </div>

            <div className="bg-gray-900 text-emerald-400 p-5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
              <pre>{JSON.stringify(health, null, 2)}</pre>
            </div>
          </div>
        )}

        {activeTab === "catalog" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Integration - Catalog</h2>
                <p className="text-sm text-gray-500">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">GET /v1/catalog</span>{" "}
                  &bull;{" "}
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">POST /v1/catalog/sync</span>{" "}
                  &bull;{" "}
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">GET /v1/catalog/sync-status</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerSync("catalog")}
                  disabled={syncing}
                  className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Sync Catalog (POST)
                </button>
              </div>
            </div>

            {/* Fetch by ID search */}
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={productIdInput}
                onChange={(e) => setProductIdInput(e.target.value)}
                placeholder="Product ID (e.g. 101 or prod_123)"
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
              />
              <button
                onClick={fetchSingleProduct}
                disabled={loadingData || !productIdInput.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                Inspect (GET /:id)
              </button>
            </div>

            {syncResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-mono">
                <p className="font-bold mb-1">Catalog Sync Response:</p>
                <pre>{JSON.stringify(syncResult, null, 2)}</pre>
              </div>
            )}

            <div className="bg-gray-900 text-emerald-400 p-5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
              <pre>{loadingData ? "Loading catalog data..." : JSON.stringify(tabData, null, 2)}</pre>
            </div>
          </div>
        )}

        {activeTab === "stock" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Integration - Stock</h2>
                <p className="text-sm text-gray-500">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">GET /v1/stock</span>{" "}
                  &bull;{" "}
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">POST /v1/stock/sync</span>{" "}
                  &bull;{" "}
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">GET /v1/stock/sync-status</span>
                </p>
              </div>
              <button
                onClick={() => triggerSync("stock")}
                disabled={syncing}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Sync Stock (POST)
              </button>
            </div>

            {syncResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-mono">
                <p className="font-bold mb-1">Stock Sync Response:</p>
                <pre>{JSON.stringify(syncResult, null, 2)}</pre>
              </div>
            )}

            <div className="bg-gray-900 text-emerald-400 p-5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
              <pre>{loadingData ? "Loading stock data..." : JSON.stringify(tabData, null, 2)}</pre>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Integration - Orders</h2>
                <p className="text-sm text-gray-500">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">GET /v1/orders</span>{" "}
                  &bull;{" "}
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">POST /v1/orders</span>{" "}
                  &bull;{" "}
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">GET /v1/orders/:id</span>
                </p>
              </div>
              <button
                onClick={() => loadTabData("orders")}
                disabled={loadingData}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loadingData ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Fetch Orders
              </button>
            </div>

            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Order ID (e.g. ord_9921)"
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
              />
              <button
                onClick={fetchSingleOrder}
                disabled={loadingData || !orderIdInput.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                Inspect (GET /:id)
              </button>
            </div>

            <div className="bg-gray-900 text-emerald-400 p-5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
              <pre>{loadingData ? "Loading orders..." : JSON.stringify(tabData, null, 2)}</pre>
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Integration - Customers</h2>
                <p className="text-sm text-gray-500">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">GET /v1/customers</span>{" "}
                  &bull;{" "}
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">POST /v1/customers/sync</span>
                </p>
              </div>
              <button
                onClick={() => triggerSync("customers")}
                disabled={syncing}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Sync Customers (POST)
              </button>
            </div>

            {syncResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-mono">
                <p className="font-bold mb-1">Customers Sync Response:</p>
                <pre>{JSON.stringify(syncResult, null, 2)}</pre>
              </div>
            )}

            <div className="bg-gray-900 text-emerald-400 p-5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
              <pre>{loadingData ? "Loading customers..." : JSON.stringify(tabData, null, 2)}</pre>
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Integration - Sales</h2>
                <p className="text-sm text-gray-500">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">GET /v1/sales</span>{" "}
                  &bull;{" "}
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">POST /v1/sales/sync</span>
                </p>
              </div>
              <button
                onClick={() => triggerSync("sales")}
                disabled={syncing}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Sync Sales (POST)
              </button>
            </div>

            {syncResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-mono">
                <p className="font-bold mb-1">Sales Sync Response:</p>
                <pre>{JSON.stringify(syncResult, null, 2)}</pre>
              </div>
            )}

            <div className="bg-gray-900 text-emerald-400 p-5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
              <pre>{loadingData ? "Loading sales..." : JSON.stringify(tabData, null, 2)}</pre>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Integration - Transactions</h2>
                <p className="text-sm text-gray-500">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">GET /v1/transactions</span>{" "}
                  &bull;{" "}
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">POST /v1/transactions/sync</span>
                </p>
              </div>
              <button
                onClick={() => triggerSync("transactions")}
                disabled={syncing}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Sync Transactions (POST)
              </button>
            </div>

            {syncResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-mono">
                <p className="font-bold mb-1">Transactions Sync Response:</p>
                <pre>{JSON.stringify(syncResult, null, 2)}</pre>
              </div>
            )}

            <div className="bg-gray-900 text-emerald-400 p-5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
              <pre>{loadingData ? "Loading transactions..." : JSON.stringify(tabData, null, 2)}</pre>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Integration - Analytics</h2>
                <p className="text-sm text-gray-500">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">GET /v1/analytics</span>{" "}
                  &bull;{" "}
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">POST /v1/analytics/sync</span>
                </p>
              </div>
              <button
                onClick={() => triggerSync("analytics")}
                disabled={syncing}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Sync Analytics (POST)
              </button>
            </div>

            {syncResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-mono">
                <p className="font-bold mb-1">Analytics Sync Response:</p>
                <pre>{JSON.stringify(syncResult, null, 2)}</pre>
              </div>
            )}

            <div className="bg-gray-900 text-emerald-400 p-5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
              <pre>{loadingData ? "Loading analytics..." : JSON.stringify(tabData, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
