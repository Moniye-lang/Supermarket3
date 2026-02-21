import express from "express";
import Product from "../models/Product.js";
import { verifyTokenAndAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET all products (pagination & search)
router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.q) query.name = { $regex: req.query.q, $options: "i" };

    const products = await Product.find(query).skip(skip).limit(limit);
    const total = await Product.countDocuments(query);

    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
router.get("/:id", async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Not found" });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin routes
router.post("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    const { name, price, stock = 0, category = "Uncategorized", image = "", description = "" } = req.body;
    const p = new Product({ name, price, stock, category, image, description });
    await p.save();
    res.status(201).json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ error: "Not found" });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ error: "Not found" });
    res.json({ msg: "Deleted", product: p });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
