import Order from "../models/Order.js";

const STORE_LOCATION = {
  name: "Agbeni Mercantile Stores",
  address: "General Gas, Akobo, Ibadan, Oyo State, Nigeria",
  lat: 7.4332,
  lng: 3.9471,
};

// 🟢 Create new order
export const createOrder = async (req, res) => {
  try {
    const { items, total, collectionMethod = "pickup", guestId } = req.body;

    if (!items || !items.length)
      return res.status(400).json({ message: "No items in order" });

    const orderData = {
      items,
      total,
      collectionMethod, // pickup or delivery
      storeLocation: STORE_LOCATION,
      status: "Pending",
    };

    if (req.user) orderData.user = req.user._id;
    else orderData.guestId = guestId || `guest_${Date.now()}`;

    const newOrder = await Order.create(orderData);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// 🟡 Get active order (for tracking)
export const getActiveOrder = async (req, res) => {
  try {
    let order;

    // 1️⃣ Logged-in user
    if (req.user) {
      order = await Order.findOne({
        user: req.user._id,
        status: { $in: ["Pending", "Processing"] },
      })
        .populate("items.productId")
        .sort({ createdAt: -1 });
    }
    // 2️⃣ Guest
    else if (req.params.guestId) {
      order = await Order.findOne({
        guestId: req.params.guestId,
        status: { $in: ["Pending", "Processing"] },
      })
        .populate("items.productId")
        .sort({ createdAt: -1 });
    }

    // 3️⃣ No active order
    if (!order)
      return res.status(404).json({ message: "No active order found" });

    res.json(order);
  } catch (err) {
    console.error("Error fetching active order:", err);
    res.status(500).json({ message: "Server error" });
  }
};
