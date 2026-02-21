// routes/tracking.js
import express from "express";
import Tracking from "../models/Tracking.js";
import authMiddleware, { verifyTokenAndAuthorization, verifyTokenAndAdmin } from "../middleware/auth.js";

const router = express.Router();

// 🟢 Get tracking path (user’s own order or admin)
router.get("/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Admins can see any order
    if (req.user.role === "admin") {
      const trackAdmin = await Tracking.findOne({ orderId }).lean();
      return res.json(trackAdmin || { path: [], latest: null });
    }

    // Regular user: verify they own the order
    const track = await Tracking.findOne({ orderId }).lean();
    if (!track) return res.json({ path: [], latest: null });

    if (track.customerId && track.customerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "You are not allowed to view this tracking info" });
    }

    res.json(track);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
