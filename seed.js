const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config({ path: ".env.local" });
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI is not set in .env.local");

// Define a simple Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  stock: { type: Number, default: 0 },
  category: { type: String, default: "Uncategorized" },
  description: { type: String, default: "" }
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

const productsData = [
  // 1. Charcuterie
  {
    name: "Gourmet Prosciutto & Melon Plate",
    price: 15500,
    category: "Charcuterie",
    stock: 12,
    image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=600&auto=format&fit=crop&q=80",
    description: "Thinly sliced dry-cured Italian ham served with sweet cantaloupe wedges and wild arugula."
  },
  {
    name: "Artisanal Salami & Cheese Board",
    price: 18900,
    category: "Charcuterie",
    stock: 8,
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop&q=80",
    description: "A deluxe selection of cured salamis, French brie, aged white cheddar, kalamata olives, and artisan crackers."
  },
  {
    name: "Truffle Infused Mortadella",
    price: 12500,
    category: "Charcuterie",
    stock: 15,
    image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=600&auto=format&fit=crop&q=80",
    description: "Premium Italian mortadella delicately flecked with black winter truffles and pistachios."
  },

  // 2. Sushi & Sashimi
  {
    name: "Premium Salmon Sashimi Platter",
    price: 22000,
    category: "Sushi & Sashimi",
    stock: 10,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80",
    description: "Fresh, melt-in-your-mouth Atlantic salmon slices served with pickled ginger, wasabi, and premium shoyu."
  },
  {
    name: "Spicy Tuna & Avocado Roll",
    price: 14550,
    category: "Sushi & Sashimi",
    stock: 20,
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&auto=format&fit=crop&q=80",
    description: "Fresh yellowfin tuna, creamy avocado, spicy Sriracha mayo, and toasted black sesame seeds."
  },
  {
    name: "Chef's Signature Dragon Roll",
    price: 19800,
    category: "Sushi & Sashimi",
    stock: 6,
    image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&auto=format&fit=crop&q=80",
    description: "Barbequed freshwater eel and cucumber inside, topped with avocado slides and sweet unagi glaze."
  },

  // 3. Fresh Juice
  {
    name: "Organic Cold-Pressed Orange Juice",
    price: 3500,
    category: "Fresh Juice",
    stock: 35,
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&auto=format&fit=crop&q=80",
    description: "100% natural cold-pressed Valencia oranges, rich in Vitamin C with zero added sugar."
  },
  {
    name: "Green Detox Elixir",
    price: 4200,
    category: "Fresh Juice",
    stock: 25,
    image: "https://images.unsplash.com/photo-1610970881699-44a5587caa9a?w=600&auto=format&fit=crop&q=80",
    description: "A clean, refreshing blend of fresh spinach, green apples, celery, cucumber, ginger root, and lime juice."
  },
  {
    name: "Pomegranate & Hibiscus Infusion",
    price: 4800,
    category: "Fresh Juice",
    stock: 18,
    image: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=600&auto=format&fit=crop&q=80",
    description: "Antioxidant-rich pomegranate juice infused with steeped hibiscus petals and a hint of mint."
  },

  // 4. Gourmet Seafood
  {
    name: "Wild-Caught Jumbo Tiger Prawns",
    price: 35000,
    category: "Gourmet Seafood",
    stock: 14,
    image: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&auto=format&fit=crop&q=80",
    description: "Juicy, shell-on jumbo tiger prawns, perfect for herb grilling or garlic-butter pan sautéing."
  },
  {
    name: "Seared Atlantic Sea Scallops",
    price: 42000,
    category: "Gourmet Seafood",
    stock: 5,
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&auto=format&fit=crop&q=80",
    description: "Plump, sweet wild Atlantic scallops ready for high-heat pan searing to get that perfect golden crust."
  },
  {
    name: "Fresh Norwegian Salmon Fillet",
    price: 28500,
    category: "Gourmet Seafood",
    stock: 12,
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80",
    description: "Prime center-cut boneless salmon fillet, exceptionally fresh and rich in heart-healthy Omega-3s."
  }
];

async function seed() {
  try {
    console.log("🔌 Connecting to MongoDB cluster (amstores)...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Database Connected.");

    // Remove existing products to avoid duplicates
    console.log("🧹 Clearing existing products from database...");
    await Product.deleteMany({});
    console.log("✅ Products collection cleared.");

    // Insert new products
    console.log(`🚀 Seeding ${productsData.length} premium products...`);
    const result = await Product.insertMany(productsData);
    console.log(`✅ Success! Seeded ${result.length} products into the database.`);

    await mongoose.disconnect();
    console.log("🔌 Disconnected from database.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
