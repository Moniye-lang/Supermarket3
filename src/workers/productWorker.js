/* eslint-disable no-restricted-globals */

// This worker handles filtering, sorting, and pagination to offload the main thread.
self.onmessage = (e) => {
    const {
        products,
        filterCategory,
        searchTerm,
        sortOption,
        priceRange,
        currentPage,
        itemsPerPage
    } = e.data;

    if (!products) return;

    let filtered = [...products];

    // 1. Filter by Category
    if (filterCategory !== "All Departments") {
        filtered = filtered.filter(
            (p) => p.category?.toLowerCase() === filterCategory.toLowerCase()
        );
    }

    // 2. Filter by Search Term
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        filtered = filtered.filter((p) =>
            p.name?.toLowerCase().includes(lowerTerm) ||
            p.description?.toLowerCase().includes(lowerTerm)
        );
    }

    // 3. Filter by Price Range
    if (priceRange) {
        filtered = filtered.filter((p) => p.price <= priceRange);
    }

    // 4. Sort
    if (sortOption === "price-low") {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-high") {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortOption === "newest") {
        // Assuming there's a createdAt or similar, otherwise fallback to index or default
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    // 5. Paginate
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    // Send back results
    self.postMessage({
        paginatedItems,
        totalItems,
        totalPages,
        currentPage
    });
};
