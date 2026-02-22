import { useEffect, useState } from "react";
import { Trash2, PlusCircle } from "lucide-react";

export default function AdminProducts({ token }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    image: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/products?limit=500`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createProduct(e) {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      return alert("Please fill all required fields.");
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to create product");

      setForm({ name: "", price: "", stock: "", category: "", image: "", description: "" });
      loadProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function removeProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to delete product");
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-4 md:p-6 lg:p-10">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
        🛍️ Admin Dashboard — Manage Products
      </h2>

      {/* Create Product Form */}
      <form
        onSubmit={createProduct}
        className="bg-white/80 backdrop-blur-md flex flex-col shadow-lg rounded-xl p-6 mb-10 max-w-5xl mx-auto border border-gray-200"
      >
        <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <PlusCircle className="text-blue-600" /> Add New Product
        </h3>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            placeholder="Product Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="number"
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <input
            type="number"
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            placeholder="Stock Quantity"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2 col-span-1 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            placeholder="Image URL"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
          <textarea
            className="border rounded-lg px-3 py-2 col-span-1 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            rows={3}
            placeholder="Product Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Product"}
        </button>
      </form>

      {/* Product Grid */}
      {loading ? (
        <p className="text-center text-gray-500">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div
              key={p._id}
              className="bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <img
                src={p.image || "/placeholder.png"}
                alt={p.name}
                className="h-44 w-full object-cover rounded-t-xl"
              />
              <div className="p-4 flex flex-col">
                <h4 className="font-semibold text-gray-800 truncate">{p.name}</h4>
                <p className="text-sm text-gray-500 capitalize">{p.category}</p>
                <p className="font-bold text-green-600 text-lg mt-1">
                  ₦{p.price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">Stock: {p.stock}</p>
                <button
                  onClick={() => removeProduct(p._id)}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
