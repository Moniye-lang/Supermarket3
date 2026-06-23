import Order from "../models/Order";

export async function cleanupOldGuestOrders() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30); // 30 days ago

    const result = await Order.deleteMany({
      guestId: { $ne: null },
      createdAt: { $lt: cutoff },
    });

    console.log(`✅ Cleaned up ${result.deletedCount} old guest orders`);
  } catch (err) {
    console.error("❌ Failed to clean up guest orders:", err);
  }
}
