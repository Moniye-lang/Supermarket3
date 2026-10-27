"use client";
import { useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CartContext } from "@/context/CartContext";
import { AuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Minus, Plus, ShoppingCart, Store, ShieldCheck, ArrowLeft, Share2, Heart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { useFavorites } from "@/context/FavoritesContext";
import { cn } from "@/lib/utils";

export default function ProductDets() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { user, token: ctxToken } = useContext(AuthContext);
    const { addToCart, openCart } = useContext(CartContext);
    const { isFavorite, toggleFavorite } = useFavorites();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingRelated, setLoadingRelated] = useState(false);
    const [qty, setQty] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

    const token = ctxToken || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    const handleBackToShopping = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        // If user navigated internally from within the store (and wasn't on a product page), go back to preserve search/filters
        if (
            typeof window !== "undefined" &&
            window.history.length > 1 &&
            document.referrer &&
            document.referrer.includes(window.location.host) &&
            !document.referrer.includes("/product/")
        ) {
            router.back();
        } else {
            router.push("/products");
        }
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" as any });
        setQty(1);
        setActiveImage(0);

        const fetchProductData = async () => {
            try {
                setLoading(true);

                const targetUrl = `/api/products/${encodeURIComponent(id)}?_t=${Date.now()}`;
                const res = await fetch(targetUrl, { cache: "no-store" });
                if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);

                const data = await res.json();
                const prodId = data?._id || data?.id;

                if (data && prodId) {
                    const prodImages = Array.isArray(data.images) && data.images.length > 0 
                        ? data.images 
                        : (data.image ? [data.image] : ["/placeholder-food.png"]);

                    setProduct({
                        ...data,
                        _id: prodId,
                        id: data.id || prodId,
                        images: prodImages,
                        stockStatus: data.stockStatus || (data.stock > 0 || data.stock === -1 ? "In Stock" : "Out of Stock")
                    });

                    // Fetch suggestions for this product
                    fetchSuggestions(data, String(prodId));
                } else {
                    setProduct(null);
                }
            } catch (err) {
                console.error("Error fetching product:", err);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        const fetchSuggestions = async (currentProd: any, currentId: string) => {
            try {
                setLoadingRelated(true);
                let suggestions: any[] = [];
                const normCurrentId = String(currentId);

                // 1. Fetch products from the same category if available
                if (currentProd.category && currentProd.category !== "All Departments") {
                    try {
                        const targetCat = encodeURIComponent(currentProd.category);
                        const relatedRes = await fetch(`/api/products?category=${targetCat}&limit=8&_t=${Date.now()}`, { cache: "no-store" });
                        if (relatedRes.ok) {
                            const relatedData = await relatedRes.json();
                            const items = Array.isArray(relatedData.products) ? relatedData.products : [];
                            suggestions = items.filter((p: any) => {
                                const pid = String(p._id || p.id || "");
                                return pid && pid !== normCurrentId && pid !== String(id);
                            });
                        }
                    } catch (catErr) {
                        console.warn("Failed fetching category suggestions:", catErr);
                    }
                }

                // 2. If fewer than 4 suggestions found in category, augment with general catalog items to guarantee 4 suggestions
                if (suggestions.length < 4) {
                    try {
                        const fallbackRes = await fetch(`/api/products?limit=12&_t=${Date.now()}`, { cache: "no-store" });
                        if (fallbackRes.ok) {
                            const fallbackData = await fallbackRes.json();
                            const fallbackItems = Array.isArray(fallbackData.products) ? fallbackData.products : [];
                            for (const item of fallbackItems) {
                                const itemPid = String(item._id || item.id || "");
                                if (!itemPid || itemPid === normCurrentId || itemPid === String(id)) continue;
                                if (!suggestions.some((s) => String(s._id || s.id || "") === itemPid)) {
                                    suggestions.push(item);
                                }
                                if (suggestions.length >= 4) break;
                            }
                        }
                    } catch (fbErr) {
                        console.warn("Failed fetching fallback suggestions:", fbErr);
                    }
                }

                setRelatedProducts(suggestions.slice(0, 4));
            } catch (err) {
                console.error("Error fetching related products:", err);
                setRelatedProducts([]);
            } finally {
                setLoadingRelated(false);
            }
        };

        if (id) {
            fetchProductData();
        }
    }, [id]);

    const handleAddToCart = () => {
        addToCart({ ...product, qty });
    };

    const handleBuyNow = () => {
        if (!token && !user) {
            addToCart({ ...product, qty });
            router.push("/signin");
            return;
        }
        addToCart({ ...product, qty });
        openCart("checkout");
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
                <Button onClick={() => router.push("/products")}>Back to Products</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-light pt-24 pb-20">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">

                <Link
                    href="/products"
                    onClick={handleBackToShopping}
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-primary transition-colors mb-8 group font-medium cursor-pointer"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to shopping
                </Link>

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
                                src={product.images[activeImage] || product.image || "/placeholder-food.png"}
                                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-food.png"; }}
                                alt={product.name}
                                className="w-full h-full object-contain hover:scale-110 transition-transform duration-500"
                            />
                        </motion.div>

                        {product.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {product.images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`w-20 h-20 rounded-xl border-2 flex-shrink-0 bg-white p-2 transition-all ${activeImage === idx ? "border-brand-primary ring-2 ring-brand-primary/20" : "border-gray-200 hover:border-gray-300"}`}
                                    >
                                        <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-contain" />
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
                                <span className={`inline-flex items-center gap-1.5 font-semibold text-sm px-3 py-1 rounded-full border ${
                                    product.stock === 0 || product.stockStatus === "Out of Stock"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        product.stock === 0 || product.stockStatus === "Out of Stock"
                                            ? "bg-red-500"
                                            : "bg-emerald-500"
                                    }`} />
                                    {product.stock === 0 || product.stockStatus === "Out of Stock"
                                        ? "Out of Stock"
                                        : "In Stock"
                                    }
                                </span>
                                {product.sku && (
                                    <>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <span className="text-xs text-gray-400">SKU: {product.sku}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-baseline gap-4 border-b border-gray-100 pb-8">
                            <span className="text-4xl font-bold text-brand-dark">₦{product.price?.toLocaleString()}</span>
                            {product.oldPrice && (
                                <span className="text-xl text-gray-400 line-through">₦{product.oldPrice.toLocaleString()}</span>
                            )}
                            {Boolean(product.discount && product.discount > 0) && (
                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                                    {product.discount}% OFF
                                </span>
                            )}
                        </div>

                        <p className="text-gray-600 leading-relaxed text-lg">
                            {product.description || "Fresh quality product available at AMStores."}
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
                                        onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-brand-primary transition-colors"
                                        disabled={qty >= (product.stock || 99)}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                                <Button
                                    size="lg"
                                    className="flex-1 text-lg py-6 rounded-xl shadow-brand-primary/25 shadow-xl"
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                >
                                    <ShoppingCart className="mr-2" /> Add to Cart
                                </Button>
                                <Button
                                    size="lg"
                                    variant="glass"
                                    className="flex-1 text-lg py-6 rounded-xl border-2 border-brand-dark/10"
                                    onClick={handleBuyNow}
                                    disabled={product.stock === 0}
                                >
                                    Buy Now
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => toggleFavorite(product)}
                                    className={cn(
                                        "py-6 px-5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center",
                                        isFavorite(product?._id)
                                            ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:border-red-800"
                                            : "border-gray-200 text-gray-700 hover:text-red-500 hover:border-red-200 dark:border-zinc-800 dark:text-gray-300"
                                    )}
                                    title={isFavorite(product?._id) ? "Remove from Favorites" : "Save to Favorites"}
                                >
                                    <Heart
                                        size={22}
                                        className={cn(
                                            "transition-transform active:scale-125",
                                            isFavorite(product?._id) ? "fill-red-500 text-red-500" : ""
                                        )}
                                    />
                                </Button>
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="grid grid-cols-2 gap-4 pt-8">
                            <div className="flex gap-3 items-start p-4 rounded-xl bg-white border border-gray-100">
                                <Store className="text-brand-primary shrink-0" />
                                <div>
                                    <h5 className="font-bold text-sm">Store Pickup</h5>
                                    <p className="text-xs text-gray-500 mt-1">Ready on arrival at AMStores</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start p-4 rounded-xl bg-white border border-gray-100">
                                <ShieldCheck className="text-brand-primary shrink-0" />
                                <div>
                                    <h5 className="font-bold text-sm">Quality Guarantee</h5>
                                    <p className="text-xs text-gray-500 mt-1">Authentic Product</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Related Products / Suggestions */}
                {(loadingRelated || relatedProducts.length > 0) && (
                    <div className="mt-32 pt-12 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                            <div>
                                <span className="text-brand-primary text-xs font-bold uppercase tracking-widest block mb-1">Recommended For You</span>
                                <h2 className="text-3xl font-display font-bold text-brand-dark">You might also like</h2>
                            </div>
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors group"
                            >
                                Browse All Products
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {loadingRelated && relatedProducts.length === 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((n) => (
                                    <div key={n} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse h-80 flex flex-col justify-between">
                                        <div className="aspect-square bg-gray-100 rounded-xl mb-4 w-full" />
                                        <div className="space-y-2">
                                            <div className="h-4 bg-gray-100 rounded w-3/4" />
                                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                                        </div>
                                        <div className="h-8 bg-gray-100 rounded mt-4 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedProducts.map((p: any) => {
                                    const prodKey = p._id || p.id;
                                    return (
                                        <ProductCard
                                            key={prodKey}
                                            product={{
                                                ...p,
                                                _id: prodKey,
                                                id: p.id || prodKey,
                                            }}
                                            onViewDetails={(prod) => {
                                                const nextId = prod?._id || prod?.id || prodKey;
                                                if (nextId) {
                                                    router.push(`/product/${nextId}`);
                                                }
                                            }}
                                            onAddToCart={(prod) => {
                                                addToCart({ ...(prod || p), qty: 1 });
                                            }}
                                            onBuyNow={(prod) => {
                                                const itemToAdd = prod || p;
                                                if (!token && !user) {
                                                    addToCart({ ...itemToAdd, qty: 1 });
                                                    router.push("/signin");
                                                    return;
                                                }
                                                addToCart({ ...itemToAdd, qty: 1 });
                                                openCart("checkout");
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
