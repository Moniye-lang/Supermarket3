"use client";
import { useEffect, useState, useContext } from "react";
import { Trash2, PlusCircle, Search, Edit2, Image as ImageIcon, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "@/context/AuthContext";

export default function AdminProductsPage() {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    image: "",
    description: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://supermarket3.onrender.com";

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/products?limit=500`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      return alert("Please fill all required fields.");
    }

    const currentToken = token || localStorage.getItem("token");

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to create product");

      setForm({ name: "", price: "", stock: "", category: "", image: "", description: "" });
      setShowModal(false);
      loadProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function removeProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const currentToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to delete product");
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  }

  const filteredProducts = (Array.isArray(products) ? products : []).filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your store's product catalog</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 cursor-pointer">
          <PlusCircle size={18} /> Add Product
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 max-w-md">
            <Input 
                placeholder="Search products..." 
                icon={<Search size={18} className="text-gray-400" />}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Products Table/Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
            <div className="p-8 text-center flex justify-center">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
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
                        <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500 uppercase tracking-wider">
                            <th className="p-4 pl-6">Product</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Stock</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredProducts.map(p => (
                            <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group">
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
                                        <p className="text-xs text-gray-500 line-clamp-1 w-48">{p.description}</p>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                        {p.category}
                                    </span>
                                </td>
                                <td className="p-4 font-medium text-gray-900">
                                    ₦{p.price?.toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <span className={`text-sm font-medium ${p.stock > 10 ? "text-green-600" : p.stock > 0 ? "text-orange-600" : "text-red-600"}`}>
                                        {p.stock} in stock
                                    </span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 bg-white rounded-lg border border-gray-200 shadow-sm transition-colors cursor-pointer">
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => removeProduct(p._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 bg-white rounded-lg border border-gray-200 shadow-sm transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showModal && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    onClick={() => setShowModal(false)}
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl cursor-pointer">
                            &times;
                        </button>
                    </div>
                    <form onSubmit={createProduct} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-gray-700">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <Input placeholder="E.g. Fresh Tomatoes" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, name: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                                <Input type="number" placeholder="0.00" value={form.price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, price: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                <Input type="number" placeholder="100" value={form.stock} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, stock: e.target.value})} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <Input placeholder="E.g. Groceries" value={form.category} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, category: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                            <Input placeholder="https://..." value={form.image} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, image: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea 
                                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                rows={3}
                                value={form.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, description: e.target.value})}
                            ></textarea>
                        </div>
                        
                        <div className="pt-4 flex gap-3">
                            <Button type="button" variant="ghost" className="flex-1 bg-gray-100 hover:bg-gray-200 cursor-pointer" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 cursor-pointer" disabled={submitting}>
                                {submitting ? "Saving..." : "Save Product"}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}
