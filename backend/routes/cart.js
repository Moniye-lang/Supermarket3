import express from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import authMiddleware, { verifyTokenAndAuthorization } from "../middleware/auth.js";

const router = express.Router();

// 🟢 Save or update user's cart
router.post("/save", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!Array.isArray(items))
      return res.status(400).json({ error: "Invalid items format" });

    // ✅ Ensure each item has full product info
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId).lean();
        return {
          productId: item.productId,
          name: product?.name || item.name || "Unknown Product",
          price: product?.price || item.price || 0,
          image: product?.image || item.image || "",
          qty: item.qty || 1,
        };
      })
    );

    let cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = enrichedItems;
      cart.updatedAt = new Date();
      await cart.save();
    } else {
      cart = await Cart.create({ userId, items: enrichedItems });
    }

    res.json({ msg: "Cart saved successfully", cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟣 Get user's cart (always returns product info)
router.get("/:userId", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0)
      return res.json({ items: [] });

    // ✅ Auto-refresh product data from DB
    const syncedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.productId).lean();
        return {
          productId: item.productId,
          qty: item.qty,
          name: product?.name || item.name || "Unknown Product",
          price: product?.price || item.price || 0,
          image: product?.image || item.image || "",
        };
      })
    );

    cart.items = syncedItems;
    await cart.save();

    res.json({ items: syncedItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
