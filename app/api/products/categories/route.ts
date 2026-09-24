import { NextResponse } from "next/server";
import { fetchWooCategories, isWooConfigured } from "@/lib/woocommerce";
import { isStoreApiConfigured, fetchLiveCatalogProducts } from "@/lib/storeApi";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { DEFAULT_PRODUCTS } from "@/lib/defaultProducts";

// GET product categories (Store API / WooCommerce API with DB backup)
export async function GET() {
  try {
    // 1. Try Store API if configured
    if (isStoreApiConfigured()) {
      try {
        const catalogResult = await fetchLiveCatalogProducts({ limit: 100 });
        if (catalogResult && Array.isArray(catalogResult.products) && catalogResult.products.length > 0) {
          const categoryCounts: Record<string, number> = {};
          catalogResult.products.forEach((p) => {
            const cat = p.category || "General";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          });

          const categories = Object.entries(categoryCounts).map(([name, count], i) => ({
            id: i + 1,
            name,
            slug: name.toLowerCase().replace(/\s+/g, "-"),
            count,
          }));

          return NextResponse.json({ categories }, {
            headers: {
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
            },
          });
        }
      } catch (storeErr: any) {
        console.warn("[Categories API] Store API categories extraction error, falling back:", storeErr.message);
      }
    }

    // 1b. Try WooCommerce if configured
    if (isWooConfigured()) {
      try {
        const wooCategories = await fetchWooCategories();
        if (Array.isArray(wooCategories) && wooCategories.length > 0) {
          return NextResponse.json({ categories: wooCategories }, {
            headers: {
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
            },
          });
        }
      } catch (wooErr: any) {
        console.warn("[Categories API] WooCommerce fetch error, falling back to DB:", wooErr.message);
      }
    }

    // 2. Database Backup: Aggregate from MongoDB
    try {
      await dbConnect();
      const distinctCategories: string[] = await Product.distinct("category");
      if (distinctCategories && distinctCategories.length > 0) {
        const categories = await Promise.all(
          distinctCategories.map(async (cat, index) => {
            const count = await Product.countDocuments({ category: cat });
            return {
              id: index + 1,
              name: cat,
              slug: cat.toLowerCase().replace(/\s+/g, "-"),
              count,
            };
          })
        );

        return NextResponse.json({ categories }, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        });
      }
    } catch (dbErr: any) {
      console.warn("[Categories API] DB lookup error:", dbErr.message);
    }

    // 3. Fallback to default catalog categories
    const categoryCounts: Record<string, number> = {};
    DEFAULT_PRODUCTS.forEach((p) => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    const fallbackCategories = Object.entries(categoryCounts).map(([name, count], i) => ({
      id: i + 1,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      count,
    }));

    return NextResponse.json({ categories: fallbackCategories });
  } catch (err: any) {
    console.error("Error in GET /api/products/categories:", err);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}
