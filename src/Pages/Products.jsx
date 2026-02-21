import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import { Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, Filter } from "lucide-react"; // Added Filter
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

export default function Products() {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  // -- State --
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Departments");
  const [priceRange, setPriceRange] = useState(100000);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState("newest");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 9 items per page
  const [totalPages, setTotalPages] = useState(1);
  const [displayedProducts, setDisplayedProducts] = useState([]);

  // Worker Ref
  const workerRef = useRef(null);

  // -- 1. Fetching Data with TanStack Query (Caching) --
  const { data: allProducts, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      return data.products || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // -- 2. Web Worker Setup --
  useEffect(() => {
    // Initialize Worker
    workerRef.current = new Worker(new URL('../workers/productWorker.js', import.meta.url));

    // Listen for messages from Worker
    workerRef.current.onmessage = (e) => {
      const { paginatedItems, totalPages } = e.data;
      setDisplayedProducts(paginatedItems);
      setTotalPages(totalPages);
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  // -- 3. Send Data to Worker when dependencies change --
  useEffect(() => {
    if (allProducts && workerRef.current) {
      workerRef.current.postMessage({
        products: allProducts,
        filterCategory,
        searchTerm,
        sortOption,
        priceRange,
        currentPage,
        itemsPerPage
      });
    }
  }, [allProducts, filterCategory, searchTerm, sortOption, priceRange, currentPage, itemsPerPage]);

  // -- Handlers --
  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const handleBuyNow = (product) => {
    addToCart(product);
    navigate("/cart");
  };

  const categories = [
    "All Departments",
    "Groceries",
    "Beverages",
    "Household",
    "Personal Care",
    "Electronics",
  ];

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-20">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

        {/* Header & Mobile Filter Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-brand-dark">Our Products</h1>
            <p className="text-gray-500 mt-1">Discover quality essentials for your home</p>
          </div>

          <button
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-700 font-medium"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} /> Filters
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* Sidebar Filters */}
          <aside className={`lg:block ${showFilters ? 'block' : 'hidden'} space-y-8 sticky top-28 h-fit z-20`}>
            <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-100 border border-gray-100">
              <div className="flex items-center gap-2 mb-6 text-brand-dark font-bold text-lg">
                <SlidersHorizontal size={20} />
                Filter By
              </div>

              {/* Search */}
              <div className="mb-8">
                <Input
                  placeholder="Search products..."
                  icon={<Search size={18} className="text-gray-400" />}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to page 1 on search
                  }}
                />
              </div>

              {/* Categories */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${filterCategory === cat ? 'bg-brand-primary border-brand-primary' : 'border-gray-300 group-hover:border-gray-400'}`}>
                        {filterCategory === cat && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 bg-white rounded-[2px]" />}
                      </div>
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={filterCategory === cat}
                        onChange={() => {
                          setFilterCategory(cat);
                          setCurrentPage(1);
                        }}
                        className="hidden"
                      />
                      <span className={`text-sm ${filterCategory === cat ? 'text-brand-primary font-semibold' : 'text-gray-600'}`}>
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Price Range</h3>
                  <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-md">
                    Max: ₦{priceRange.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="200000"
                  step="1000"
                  value={priceRange}
                  onChange={(e) => {
                    setPriceRange(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
              </div>

              {/* Sort */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Sort By</h3>
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary cursor-pointer"
                  >
                    <option value="newest">Newest Arrivals</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-3">
            {isLoading ? (
              /* Skeleton Loaders */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-2xl h-[400px] animate-pulse">
                    <div className="h-2/3 bg-gray-100 rounded-t-2xl" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-20">
                <p className="text-red-500 text-lg">Failed to load products. Please try again later.</p>
                <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
              </div>
            ) : displayedProducts.length === 0 ? (
              /* No Products Found State */
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-center px-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  We couldn't find any products matching your filters. Try adjusting your search term or price range.
                </p>
                <Button
                  variant="primary"
                  className="mt-6"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("All Departments");
                    setPriceRange(200000);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {displayedProducts.map((p) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      onAddToCart={handleAddToCart}
                      onBuyNow={handleBuyNow}
                      onViewDetails={(prod) => navigate(`/product/${prod._id}`)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="ghost"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="rounded-full w-10 h-10 p-0 flex items-center justify-center disabled:opacity-50"
                    >
                      <ChevronLeft size={20} />
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-full font-medium transition-all ${currentPage === page
                              ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <Button
                      variant="ghost"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="rounded-full w-10 h-10 p-0 flex items-center justify-center disabled:opacity-50"
                    >
                      <ChevronRight size={20} />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
