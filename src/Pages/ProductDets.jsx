
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { Button } from "../components/ui/Button";
import { Minus, Plus, ShoppingCart, Star, Truck, ShieldCheck, ArrowLeft, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../components/ProductCard";

export default function ProductDets() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState([]);

    const token = localStorage.getItem("token");

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        const fetchProduct = async () => {
            try {
                setLoading(true);
                // Fetch product details
                const res = await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/products/${id}`); // Adjust endpoint if needed
                const data = await res.json();

                // If the API returns the product directly or in a wrapper
                const prod = data.product || data;
                setProduct({
                    ...prod,
                    name: prod.name || prod.title,
                    images: prod.images || [prod.image] // Ensure array
                });

                // Fetch Related (Mock or real)
                // For now, let's fetch a few products as "related"
                const relatedRes = await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/products?page=1&limit=4`);
                const relatedData = await relatedRes.json();
                const filtered = (relatedData.products || []).filter(p => p._id !== id).slice(0, 4);
                setRelatedProducts(filtered);

            } catch (err) {
                console.error("Error fetching product details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        if (!token) return navigate("/signin");
        addToCart({ ...product, qty });
    };

    const handleBuyNow = () => {
        if (!token) return navigate("/signin");
        navigate("/checkout", { state: { items: [{ ...product, qty }] } });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-light">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Product Not Found</h2>
                <Button onClick={() => navigate("/products")}>Back to Products</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-light pt-24 pb-20">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">

                {/* Breadcrumb / Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-brand-primary transition-colors mb-8 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to shopping
                </button>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">

                    {/* Image Gallery */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="aspect-square bg-white rounded-3xl border border-gray-100 p-8 flex items-center justify-center shadow-lg shadow-gray-100 relative overflow-hidden"
                        >
                            <img
                                key={activeImage}
                                src={product.images[activeImage] || "/placeholder-food.png"}
                                alt={product.name}
                                className="w-full h-full object-contain hover:scale-110 transition-transform duration-500"
                            />
                            {product.discount && (
                                <span className="absolute top-6 left-6 bg-red-500 text-white font-bold px-4 py-1.5 rounded-full shadow-lg">
                                    -{product.discount}%
                                </span>
                            )}
                        </motion.div>

                        {/* Thumbnails */}
                        {product.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`w-20 h-20 rounded-xl border-2 flex-shrink-0 bg-white p-2 transition-all ${activeImage === idx ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-brand-primary font-semibold tracking-wide uppercase text-sm">
                                    {product.category || "General"}
                                </span>
                                <button className="text-gray-400 hover:text-brand-primary transition-colors">
                                    <Share2 size={20} />
                                </button>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-display font-bold text-brand-dark leading-tight mb-4">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Star size={18} fill="currentColor" />
                                    <span className="font-bold text-gray-900">4.8</span>
                                </div>
                                <span>(128 Reviews)</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span className="text-green-600 font-medium">In Stock</span>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-4 border-b border-gray-100 pb-8">
                            <span className="text-4xl font-bold text-brand-dark">₦{product.price?.toLocaleString()}</span>
                            {product.oldPrice && (
                                <span className="text-xl text-gray-400 line-through">₦{product.oldPrice.toLocaleString()}</span>
                            )}
                        </div>

                        <p className="text-gray-600 leading-relaxed text-lg">
                            {product.description || "Experience premium quality with our carefully selected products. Freshness guaranteed directly to your doorstep."}
                        </p>

                        {/* Quantity & Actions */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-6">
                                <span className="font-semibold text-gray-900">Quantity</span>
                                <div className="flex items-center border border-gray-200 rounded-full bg-white">
                                    <button
                                        onClick={() => setQty(Math.max(1, qty - 1))}
                                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-brand-primary transition-colors"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-10 text-center font-bold text-gray-900">{qty}</span>
                                    <button
                                        onClick={() => setQty(qty + 1)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-brand-primary transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="lg" className="flex-1 text-lg py-6 rounded-xl shadow-brand-primary/25 shadow-xl" onClick={handleAddToCart}>
                                    <ShoppingCart className="mr-2" /> Add to Cart
                                </Button>
                                <Button size="lg" variant="glass" className="flex-1 text-lg py-6 rounded-xl border-2 border-brand-dark/10" onClick={handleBuyNow}>
                                    Buy Now
                                </Button>
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="grid grid-cols-2 gap-4 pt-8">
                            <div className="flex gap-3 items-start p-4 rounded-xl bg-white border border-gray-100">
                                <Truck className="text-brand-primary shrink-0" />
                                <div>
                                    <h5 className="font-bold text-sm">Fast Delivery</h5>
                                    <p className="text-xs text-gray-500 mt-1">Within 30mins in Ibadan</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start p-4 rounded-xl bg-white border border-gray-100">
                                <ShieldCheck className="text-brand-primary shrink-0" />
                                <div>
                                    <h5 className="font-bold text-sm">Quality Guarantee</h5>
                                    <p className="text-xs text-gray-500 mt-1">Verified freshness</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-32">
                        <h2 className="text-3xl font-display font-bold text-brand-dark mb-10">You might also like</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedProducts.map(p => (
                                <ProductCard
                                    key={p._id}
                                    product={{ ...p, name: p.name || p.title }} // normalization if needed
                                    onViewDetails={(prod) => navigate(`/product/${prod._id}`)}
                                    onAddToCart={() => addToCart({ ...p, qty: 1 })}
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}