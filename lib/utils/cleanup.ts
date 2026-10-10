import Order from "../models/Order";

export async function cleanupOldGuestOrders() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30); // 30 days ago

    // Clean up abandoned unfulfilled orders older than 30 days
    const result = await Order.deleteMany({
      fulfilled: false,
      status: { $in: ["payment_pending", "cancelled"] },
      createdAt: { $lt: cutoff },
    });

    if (result.deletedCount > 0) {
      console.log(`✅ Cleaned up ${result.deletedCount} old abandoned orders`);
    }
  } catch (err) {
    console.error("❌ Failed to clean up abandoned orders:", err);
  }
}
