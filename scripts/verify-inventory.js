const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: ".env.local" });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const productsCol = mongoose.connection.db.collection("products");
  const ordersCol = mongoose.connection.db.collection("orders");

  const stressProducts = await productsCol.find({ name: /STRESS/i }).toArray();
  const stressOrders = await ordersCol.find({ pickupCode: /TEST/i }).toArray();
  const totalProducts = await productsCol.countDocuments();
  const sample = await productsCol.find().limit(5).project({ name: 1, stock: 1, price: 1, category: 1 }).toArray();

  console.log("=== INVENTORY INTEGRITY AUDIT ===");
  console.log("Stress test products remaining:", stressProducts.length);
  console.log("Stress test orders remaining:", stressOrders.length);
  console.log("Total real products in catalog:", totalProducts);
  console.log("Sample real products:", JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
}

check().catch(console.error);
