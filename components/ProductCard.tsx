"use client";
import { motion } from "framer-motion";
import { ShoppingCart, Eye, Heart, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";

interface Product {
    _id: string;
    name?: string;
    title?: string;
    image?: string;
    images?: string[];
    price?: number;
    oldPrice?: number;
    category?: string;
    discount?: number;
    description?: string;
    stock?: number;        // -1 = in stock but not tracked, 0+ = real count
    stockTracked?: boolean; // true = real WooCommerce quantity
    stockStatus?: string;
}

interface ProductCardProps {
    product: Product;
    onAddToCart?: (product: Product) => void;
    onBuyNow?: (product: Product) => void;
    onViewDetails?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onBuyNow, onViewDetails }: ProductCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-300 h-full flex flex-col"
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-50">
                <img
                    src={product.image || "/placeholder-food.png"}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-food.png"; }}
                    alt={product.name || product.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.category && (
                        <span className="bg-white/90 backdrop-blur text-brand-dark text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                            {product.category}
                        </span>
                    )}
                    {product.discount && (
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                            -{product.discount}%
                        </span>
                    )}
                </div>

                {/* Stock Badge – bottom-left corner */}
                <div className="absolute bottom-3 left-3">
                    {product.stockStatus === "Out of Stock" || product.stock === 0 ? (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                            Out of Stock
                        </span>
                    ) : product.stockTracked && product.stock !== undefined && product.stock > 0 && product.stock <= 10 ? (
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                            Only {product.stock} left!
                        </span>
                    ) : product.stockTracked && product.stock !== undefined && product.stock > 10 && product.stock <= 50 ? (
                        <span className="bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                            {product.stock} in stock
                        </span>
                    ) : null}
                </div>

                {/* Wishlist Button */}
                <button aria-label="Add to wishlist" className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-red-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 duration-300">
                    <Heart size={18} />
                </button>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <div className="flex gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Button
                            variant="glass"
                            size="icon"
                            aria-label="View Details"
                            className="bg-white text-brand-dark hover:text-brand-primary rounded-full h-10 w-10"
                            onClick={() => onViewDetails && onViewDetails(product)}
                        >
                            <Eye size={20} />
                        </Button>
                        <Button
                            variant="primary"
                            size="icon"
                            aria-label="Add to cart"
                            className="rounded-full h-10 w-10 shadow-lg shadow-brand-primary/30"
                            onClick={() => onAddToCart && onAddToCart(product)}
                        >
                            <ShoppingCart size={20} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex-grow">
                    <h3
                        className="font-display font-semibold text-lg text-brand-dark mb-1 line-clamp-1 group-hover:text-brand-primary transition-colors cursor-pointer"
                        onClick={() => onViewDetails && onViewDetails(product)}
                    >
                        {product.name || product.title}
                    </h3>
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">{product.description || "Fresh quality product for your daily needs."}</p>
                </div>

                <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">Price</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-brand-dark">₦{product.price?.toLocaleString()}</span>
                            {product.oldPrice && (
                                <span className="text-sm text-gray-500 line-through">₦{product.oldPrice.toLocaleString()}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 ml-auto">
                        <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Add ${product.name || product.title || "product"} to cart`}
                            className="h-8 px-2 text-xs flex items-center gap-1 border border-brand-primary/30 text-gray-800"
                            disabled={product.stockStatus === "Out of Stock" || product.stock === 0}
                            onClick={() => onAddToCart && onAddToCart(product)}
                        >
                            <ShoppingCart size={14} /> Add
                        </Button>
                        <Button
                            size="sm"
                            variant="primary"
                            aria-label={`Buy ${product.name || product.title || "product"} now`}
                            className="h-8 px-3 text-xs"
                            disabled={product.stockStatus === "Out of Stock" || product.stock === 0}
                            onClick={() => onBuyNow && onBuyNow(product)}
                        >
                            Buy Now
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
