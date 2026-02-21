import { motion } from "framer-motion";
import { ShoppingCart, Zap, Eye, Heart } from "lucide-react";
import { cn } from "../utils/cn";
import { Button } from "./ui/Button";

export default function ProductCard({ product, onAddToCart, onBuyNow, onViewDetails }) {
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
                    alt={product.name}
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

                {/* Wishlist Button */}
                <button className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 duration-300">
                    <Heart size={18} />
                </button>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <div className="flex gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Button
                            variant="glass"
                            size="icon"
                            className="bg-white text-brand-dark hover:text-brand-primary rounded-full h-10 w-10"
                            onClick={() => onViewDetails && onViewDetails(product)}
                        >
                            <Eye size={20} />
                        </Button>
                        <Button
                            variant="primary"
                            size="icon"
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
                    <h3 className="font-display font-semibold text-lg text-brand-dark mb-1 line-clamp-1 group-hover:text-brand-primary transition-colors cursor-pointer" onClick={() => onViewDetails && onViewDetails(product)}>
                        {product.name}
                    </h3>
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2">{product.description || "Fresh quality product for your daily needs."}</p>
                </div>

                <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Price</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-brand-dark">₦{product.price?.toLocaleString()}</span>
                            {product.oldPrice && (
                                <span className="text-sm text-gray-400 line-through">₦{product.oldPrice.toLocaleString()}</span>
                            )}
                        </div>
                    </div>

                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-brand-primary bg-brand-primary/5 hover:bg-brand-primary hover:text-white transition-all ml-auto"
                        onClick={() => onBuyNow && onBuyNow(product)}
                    >
                        Buy Now
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

