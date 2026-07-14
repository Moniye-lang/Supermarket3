import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";

const NEW_PRODUCTS = [
  {
    name: "Delis Signature Charcuterie Board",
    price: 18500,
    category: "Charcuterie",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    description: "A hand-curated selection of prosciutto, salami, aged cheddar, camembert cheese, grapes, and crackers.",
    stock: 12
  },
  {
    name: "Prosciutto di Parma (200g)",
    price: 7500,
    category: "Charcuterie",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80",
    description: "Thinly sliced, dry-cured Italian ham. Tender texture with a rich, salty-sweet flavor profile.",
    stock: 24
  },
  {
    name: "French Camembert Wheel",
    price: 6200,
    category: "Charcuterie",
    image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80",
    description: "Creamy, soft-ripened cow's milk cheese from Normandy. Rich, buttery, and earthy flavor.",
    stock: 18
  },
  {
    name: "Aged Parmigiano Reggiano (300g)",
    price: 8400,
    category: "Charcuterie",
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=600&auto=format&fit=crop&q=80",
    description: "Aged for 24 months. Granular, crumbly texture with an intense, nutty and savory flavor.",
    stock: 15
  },
  {
    name: "Premium Salmon Nigiri Set",
    price: 9500,
    category: "Sushi & Sashimi",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80",
    description: "6 pieces of hand-pressed seasoned sushi rice topped with premium grade fresh Atlantic salmon.",
    stock: 10
  },
  {
    name: "Delis Signature Dragon Roll",
    price: 8200,
    category: "Sushi & Sashimi",
    image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&auto=format&fit=crop&q=80",
    description: "Crabmeat and cucumber roll wrapped in layers of avocado, unagi eel, and topped with tobiko.",
    stock: 15
  },
  {
    name: "Spicy Tuna Hand Roll (Maki)",
    price: 7200,
    category: "Sushi & Sashimi",
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&auto=format&fit=crop&q=80",
    description: "Fresh yellowfin tuna tossed in spicy sriracha mayo, rolled in sushi rice and crisp nori seaweed sheets.",
    stock: 20
  },
  {
    name: "Organic Green Cleanse Juice (500ml)",
    price: 3500,
    category: "Fresh Juice",
    image: "https://images.unsplash.com/photo-1610970881699-44a5587caaec?w=600&auto=format&fit=crop&q=80",
    description: "Cold-pressed kale, organic celery, cucumber, green apple, ginger, and organic lime juice.",
    stock: 30
  },
  {
    name: "Pomegranate Ginger Zest",
    price: 3800,
    category: "Fresh Juice",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
    description: "100% pure cold-pressed pomegranate juice blended with zesty ginger root and lemon slices.",
    stock: 25
  },
  {
    name: "Atlantic Lobster Tails (Pair)",
    price: 28050,
    category: "Gourmet Seafood",
    image: "https://images.unsplash.com/photo-1559742811-82428df491db?w=600&auto=format&fit=crop&q=80",
    description: "Two premium wild-caught Atlantic lobster tails. Sweet, firm, and succulent meat. Ready to steam or grill.",
    stock: 6
  },
  {
    name: "Fresh Scottish Smoked Salmon",
    price: 11500,
    category: "Gourmet Seafood",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80",
    description: "Premium oak-smoked Scottish salmon slices. Highly delicate texture, perfect for bagels and canapés.",
    stock: 16
  },
  {
    name: "Wild-Caught Oysters (6 Pack)",
    price: 14000,
    category: "Gourmet Seafood",
    image: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=600&auto=format&fit=crop&q=80",
    description: "6 pieces of live, fresh wild oysters. Harvested sustainably and shipped chilled on ice.",
    stock: 8
  }
];

export async function GET() {
  try {
    await dbConnect();
    // Drop existing products
    await Product.deleteMany({});
    // Seed new products
    const products = await Product.insertMany(NEW_PRODUCTS);
    return NextResponse.json({ success: true, count: products.length, products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
