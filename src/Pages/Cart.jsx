import { useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { Button } from "../components/ui/Button";
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart() {
  const {
    cart,
    addToCart,
    removeOne,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice,
    loading,
  } = useContext(CartContext);

  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-20 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-display font-bold text-brand-dark mb-8">
          Your Cart <span className="text-gray-400 text-2xl font-normal ml-2">({totalItems} items)</span>
        </h1>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
            <div className="w-24 h-24 bg-brand-primary/5 rounded-full flex items-center justify-center mb-6 text-brand-primary">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-2xl font-bold text-brand-dark mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 max-w-sm">Looks like you haven't added anything to your cart yet.</p>
            <Link to="/Products">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.productId || item._id} // creating a robust key
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    layout
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-6 items-center"
                  >
                    <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      <img
                        src={item.image || "/placeholder-food.png"}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-brand-dark">{item.name}</h3>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <p className="text-brand-primary font-bold mb-4">₦{item.price?.toLocaleString()}</p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-200 rounded-full bg-gray-50">
                          <button
                            onClick={() => removeOne(item.productId)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-brand-primary transition-colors disabled:opacity-50"
                            disabled={item.qty <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-bold text-sm text-gray-900">{item.qty}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-brand-primary transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="flex justify-between items-center pt-4">
                <Link to="/Products" className="text-gray-500 hover:text-brand-primary font-medium flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Continue Shopping
                </Link>
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 font-medium text-sm"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-100 sticky top-28 border border-gray-100">
                <h3 className="text-xl font-bold text-brand-dark mb-6">Order Summary</h3>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">₦{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="text-gray-900">₦0.00</span>
                  </div>
                  <div className="h-px bg-gray-100 my-4" />
                  <div className="flex justify-between text-lg font-bold text-brand-dark">
                    <span>Total</span>
                    <span>₦{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  className="w-full py-6 text-lg shadow-brand-primary/25 shadow-xl"
                  onClick={() => navigate("/Checkout", { state: { items: cart, fromCart: true, total: totalPrice } })}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

