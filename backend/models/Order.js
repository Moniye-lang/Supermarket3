import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pickupName: { type: String, required: true }, // name of person for pickup/delivery
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    amount: { type: Number, required: true },
    deliveryAddress: { type: String },
    collectionMethod: { type: String, enum: ["pickup", "delivery"], default: "delivery" },
    paymentMethod: { type: String, default: "manual_transfer" },
    paymentStatus: { type: String, default: "pending" },
    status: { type: String, default: "pending" },
    pickupCode: { type: String, required: true }, // 4-digit code
    fulfilled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
