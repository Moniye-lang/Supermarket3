import express from "express";
import Order from "../models/Order.js";
import { verifyTokenAndWorker } from "../middleware/auth.js"; // changed here

const router = express.Router();

// ✅ Confirm order pickup/delivery (workers or admins)
router.post("/confirm", verifyTokenAndWorker, async (req, res) => {
  try {
    const { name, code } = req.body;

    // Validation
    if (!name || !code) {
      return res.status(400).json({ error: "Name and code are required." });
    }

    // Find order by name and pickup code
    const order = await Order.findOne({
      pickupName: name.trim(),
      pickupCode: code.trim(),
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found or invalid code." });
    }

    if (order.fulfilled) {
      return res.status(400).json({ error: "Order already fulfilled." });
    }

    // Mark as fulfilled
    order.fulfilled = true;
    order.fulfilledBy = req.user.id; // ✅ record who confirmed it
    order.fulfilledAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: `Order confirmed by ${req.user.role}.`,
      order,
    });
  } catch (err) {
    console.error("Worker confirm error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
