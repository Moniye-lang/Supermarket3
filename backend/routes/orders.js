import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import authMiddleware, { verifyTokenAndAdmin } from "../middleware/auth.js";

const router = express.Router();

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// 🟢 Create order
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items, deliveryAddress, collectionMethod, customerName, paymentMethod } = req.body;

    if (!items?.length) return res.status(400).json({ error: "No items provided" });
    if (!customerName?.trim()) return res.status(400).json({ error: "Name is required" });

    let amount = 0;
    const detailed = [];

    for (const it of items) {
      const p = await Product.findById(it.productId);
      if (!p) return res.status(404).json({ error: `Product ${it.productId} not found` });

      detailed.push({ productId: p._id, qty: it.qty, price: p.price });
      amount += p.price * it.qty;
    }

    const order = new Order({
      customerId: req.user.id,
      pickupName: customerName.trim(), // store customerName in DB as pickupName
      items: detailed,
      amount,
      deliveryAddress: deliveryAddress || "N/A",
      collectionMethod,
      paymentMethod: paymentMethod || "manual_transfer",
      pickupCode: generateCode(),
      fulfilled: false,
    });

    await order.save();

    const io = req.app.get("io");
    if (io) io.emit("orderCreated", order);

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Get latest order for signed-in user
router.get("/latest/:collectionMethod", authMiddleware, async (req, res) => {
  try {
    const { collectionMethod } = req.params;
    const order = await Order.findOne({ customerId: req.user.id, collectionMethod })
      .sort({ createdAt: -1 })
      .populate("items.productId");

    if (!order) return res.status(404).json({ error: "No recent order found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Admin: get all orders
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("items.productId");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Mark order as completed (for delivery or pickup)
router.post("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.fulfilled = true;
    order.status = "delivered";
    await order.save();

    const io = req.app.get("io");
    if (io) io.emit("order:status", { orderId: id, status: "delivered" });

    res.json({ success: true, message: "Order marked as completed", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
