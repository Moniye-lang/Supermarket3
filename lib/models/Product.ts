import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  stock: { type: Number, default: 0 },
  category: { type: String, default: "Uncategorized" },
  description: { type: String, default: "" },
  sku: { type: String, default: "" },
  storeProductId: { type: String, default: "" },
}, { timestamps: true });

productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ storeProductId: 1 }, { sparse: true });
productSchema.index({ sku: 1 }, { sparse: true });
productSchema.index({ stock: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

export default mongoose.models.Product || mongoose.model("Product", productSchema);
