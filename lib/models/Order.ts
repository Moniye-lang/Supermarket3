import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pickupName: { type: String, required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    amount: { type: Number, required: true },
    deliveryAddress: { type: String },
    customerPhone: { type: String },
    collectionMethod: { type: String, enum: ["pickup", "delivery"], default: "delivery" },
    paymentMethod: { type: String, default: "manual_transfer" },
    paymentStatus: { type: String, default: "pending" },
    status: { type: String, default: "pending" },
    goodsStatus: { type: String, default: "" },
    pickupCode: { type: String, required: true },
    fulfilled: { type: Boolean, default: false },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedToWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignmentMode: { type: String, enum: ["manual", "automatic"], default: null },
    assignmentStatus: { type: String, enum: ["pending", "assigned", "unassigned"], default: "unassigned" },
    assignedAt: { type: Date, default: null },
    reassignmentHistory: [
      {
        assignedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        assignmentMode: { type: String, enum: ["manual", "automatic"] },
        assignedAt: { type: Date, default: Date.now },
        logMessage: { type: String }
      }
    ],
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ assignedTo: 1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
