// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  stock: { type: Number, default: 0 },
  category: { type: String, default: "Uncategorized" },
  description: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model("Product", productSchema);
