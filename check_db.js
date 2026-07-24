const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config({ path: ".env.local" });
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is not set in .env.local");

async function run() {
  await mongoose.connect(uri);
  console.log("Connected to event1test");
  
  const collections = await mongoose.connection.db.collections();
  console.log("Collections in event1test:");
  for (let col of collections) {
    const count = await col.countDocuments();
    console.log(`- ${col.collectionName} (Count: ${count})`);
    if (col.collectionName === "products") {
       const items = await col.find().limit(3).toArray();
       console.log("Sample items:", JSON.stringify(items));
    }
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
