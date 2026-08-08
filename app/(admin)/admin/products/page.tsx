"use client";
import { useEffect, useState, useContext, useCallback } from "react";
import {
  Search, Image as ImageIcon, Package, ExternalLink, RefreshCw,
  Tag, PlusCircle, Edit2, Trash2, X, Check, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthContext } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const WOO_ADMIN_URL = "https://wc.agbenimercantilestores.com/wp-admin/edit.php?post_type=product";
const API_URL = "";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  salePrice: string;
  stock: string;
  sku: string;
  categoryId: string;
  imageUrl: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", price: "", salePrice: "",
  stock: "", sku: "", categoryId: "", imageUrl: "",
};

export default function AdminProductsPage() {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Modal state
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : "");

  const loadProducts = useCallback(async (currentPage = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/products?page=${currentPage}&limit=20`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pages || 1);
      setTotalProducts(data.total || 0);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/categories`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {}
  }, []);

  useEffect(() => { loadProducts(page); }, [page, loadProducts]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Open Modals ─────────────────────────────────────────────────────────────

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setSelectedProduct(null);
    setModal("create");
  }

  function openEdit(product: any) {
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.regularPrice || product.price || ""),
      salePrice: String(product.salePrice || ""),
      stock: String(product.stock ?? ""),
      sku: product.sku || "",
      categoryId: String(product.categories?.[0]?.id || ""),
      imageUrl: product.image || "",
    });
    setFormError("");
    setSelectedProduct(product);
    setModal("edit");
  }

  function openDelete(product: any) {
    setSelectedProduct(product);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
    setSelectedProduct(null);
    setFormError("");
  }

  // ─── Submit Handlers ──────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) { setFormError("Name and price are required."); return; }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          salePrice: form.salePrice ? Number(form.salePrice) : undefined,
          stock: form.stock !== "" ? Number(form.stock) : undefined,
          sku: form.sku,
          categoryId: form.categoryId ? Number(form.categoryId) : undefined,
          imageUrl: form.imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed to create product"); return; }
      closeModal();
      loadProducts(page);
    } catch (err: any) {
      setFormError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) { setFormError("Name and price are required."); return; }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`${API_URL}/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          salePrice: form.salePrice ? Number(form.salePrice) : undefined,
          stock: form.stock !== "" ? Number(form.stock) : undefined,
          sku: form.sku,
          categoryId: form.categoryId ? Number(form.categoryId) : undefined,
          imageUrl: form.imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed to update product"); return; }
      closeModal();
      loadProducts(page);
    } catch (err: any) {
      setFormError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/products/${selectedProduct.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to delete product"); return; }
      closeModal();
      loadProducts(page);
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Form Field Component ─────────────────────────────────────────────────────

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
        {children}
      </div>
    );
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors";

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Products Inventory</h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              WooCommerce Live
            </span>
          </div>
          <p className="text-gray-500 text-sm">{totalProducts} total products synced from WooCommerce</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => loadProducts(page)} className="flex items-center gap-2 cursor-pointer">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
          <Button onClick={openCreate} className="flex items-center gap-2 cursor-pointer">
            <PlusCircle size={18} /> Add Product
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by name, category, or SKU..."
            icon={<Search size={18} className="text-gray-400" />}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
        <a href={WOO_ADMIN_URL} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-primary transition-colors">
          <ExternalLink size={14} /> Open in WooCommerce
        </a>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-500">Fetching WooCommerce products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No products found</p>
            <p className="text-sm">Try adjusting your search or add a new product.</p>
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
                  <th className="p-4">Stock</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map(p => (
                  <tr key={p._id || p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4 pl-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-400" size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">{p.description || "No description"}</p>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono text-gray-600">{p.sku || "—"}</td>
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
                        p.stockStatus === "Out of Stock" || p.stock === 0
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : p.stock <= 10
                          ? "bg-orange-50 text-orange-700 border border-orange-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {p.stock !== undefined ? `${p.stock} units` : p.stockStatus || "—"}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 text-gray-400 hover:text-blue-600 bg-white rounded-lg border border-gray-200 shadow-sm transition-colors cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => openDelete(p)}
                          className="p-2 text-gray-400 hover:text-red-600 bg-white rounded-lg border border-gray-200 shadow-sm transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      <AnimatePresence>
        {(modal === "create" || modal === "edit") && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">
                  {modal === "create" ? "Add New Product" : "Edit Product"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={22} />
                </button>
              </div>
              <form onSubmit={modal === "create" ? handleCreate : handleEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <Field label="Product Name *">
                  <input className={inputClass} placeholder="E.g. Indomie Noodles (Pack of 5)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Regular Price (₦) *">
                    <input className={inputClass} type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                  </Field>
                  <Field label="Sale Price (₦)">
                    <input className={inputClass} type="number" min="0" step="0.01" placeholder="Optional" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Stock Quantity">
                    <input className={inputClass} type="number" min="0" placeholder="E.g. 100" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                  </Field>
                  <Field label="SKU">
                    <input className={inputClass} placeholder="E.g. INM-001" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Category">
                  <select className={inputClass} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">Select a category</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Image URL">
                  <input className={inputClass} placeholder="https://example.com/image.jpg" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
                </Field>
                {form.imageUrl && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <Field label="Description">
                  <textarea className={inputClass + " resize-none"} rows={3} placeholder="Short product description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </Field>

                {formError && (
                  <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-200 flex items-center gap-2">
                    <AlertTriangle size={16} /> {formError}
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <Button type="button" variant="ghost" className="flex-1 bg-gray-100 hover:bg-gray-200 cursor-pointer" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 cursor-pointer flex items-center justify-center gap-2" disabled={submitting}>
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Check size={16} /> {modal === "create" ? "Create Product" : "Save Changes"}</>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}

        {modal === "delete" && selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl shadow-2xl z-50 p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Product?</h2>
              <p className="text-sm text-gray-500 mb-6">
                This will permanently delete <strong className="text-gray-800">"{selectedProduct.name}"</strong> from WooCommerce. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 bg-gray-100 hover:bg-gray-200 cursor-pointer" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 cursor-pointer flex items-center justify-center gap-2"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Trash2 size={16} /> Delete</>
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
