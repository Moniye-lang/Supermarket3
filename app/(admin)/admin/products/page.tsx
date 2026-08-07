"use client";
import { useEffect, useState, useContext } from "react";
import { Search, Image as ImageIcon, Package, ExternalLink, RefreshCw, Tag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthContext } from "@/context/AuthContext";

export default function AdminProductsPage() {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const WOO_ADMIN_URL = "https://wc.agbenimercantilestores.com/wp-admin/edit.php?post_type=product";

  useEffect(() => {
    loadProducts(page);
  }, [page]);

  async function loadProducts(currentPage = 1) {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/products?page=${currentPage}&limit=20`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pages || 1);
      setTotalProducts(data.total || (data.products?.length || 0));
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = (Array.isArray(products) ? products : []).filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">WooCommerce Inventory</h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Sync
            </span>
          </div>
          <p className="text-gray-500 text-sm">Managing products sourced from WooCommerce REST API ({totalProducts} total products)</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => loadProducts(page)} className="flex items-center gap-2 cursor-pointer">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
          <a href={WOO_ADMIN_URL} target="_blank" rel="noopener noreferrer">
            <Button className="flex items-center gap-2 cursor-pointer bg-brand-dark hover:bg-black">
              <ExternalLink size={16} /> Manage in WooCommerce
            </Button>
          </a>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-3 text-sm text-amber-900 shadow-sm">
        <Tag className="text-amber-600 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="font-bold">WooCommerce Product Source Active</p>
          <p className="text-xs text-amber-800 mt-0.5">
            Products, inventory levels, categories, images, and prices are managed directly in your WooCommerce store admin panel and automatically synchronized to AMStores.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 max-w-md">
          <Input 
            placeholder="Search by product name, category, or SKU..." 
            icon={<Search size={18} className="text-gray-400" />}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-500">Fetching WooCommerce products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No products found</p>
            <p className="text-sm">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock Status</th>
                  <th className="p-4 pr-6 text-right">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map(p => (
                  <tr key={p._id || p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">{p.description || "No description"}</p>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono text-gray-600">
                      {p.sku || "—"}
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
                        {p.category || "General"}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      ₦{p.price?.toLocaleString()}
                      {p.oldPrice && (
                        <span className="text-xs text-gray-400 line-through block font-normal">
                          ₦{p.oldPrice.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        p.stockStatus === "In Stock" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {p.stockStatus || (p.stock > 0 ? "In Stock" : "Out of Stock")} ({p.stock} qty)
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <a 
                        href={`${WOO_ADMIN_URL}&post=${p.id}&action=edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                      >
                        Edit in WooCommerce <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
