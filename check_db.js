const mongoose = require("mongoose");
const uri = "mongodb+srv://davidadeniyi269:AbsJi834%5EeKGYU%40@cluster0.zwijmfw.mongodb.net/event1test?retryWrites=true&w=majority&appName=Cluster0";

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

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
