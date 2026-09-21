import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import { verifyWorker } from "@/lib/authMiddleware";
import pusher from "@/lib/pusher";
import { sendPushToUser } from "@/lib/subscriptions";

export async function POST(req: Request) {
  try {
    await dbConnect();

    // Verify worker access
    const authUser = await verifyWorker(req);
    if (!authUser) {
      return NextResponse.json({ error: "Worker access required!" }, { status: 403 });
    }

    const { orderId, code } = await req.json();

    // Validation
    if (!orderId || !code) {
      return NextResponse.json({ error: "Order ID and 4-digit code are required." }, { status: 400 });
    }

    // Find order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.fulfilled) {
      return NextResponse.json({ error: "Order is already fulfilled." }, { status: 400 });
    }

    // Verify code safely
    const expectedCode = String(order.pickupCode || order.code || (order._id ? order._id.toString().slice(-6) : "")).trim().toUpperCase();
    const providedCode = String(code).trim().toUpperCase();

    if (expectedCode !== providedCode) {
      return NextResponse.json({ error: `Incorrect code entered. Expected "${expectedCode}", got "${providedCode}".` }, { status: 400 });
    }

    const newStatus = order.collectionMethod === "delivery" ? "delivered" : "picked_up";

    // Mark as fulfilled
    order.fulfilled = true;
    order.fulfilledBy = authUser.id;
    order.fulfilledAt = new Date();
    order.status = newStatus;
    if (!order.assignedToWorkerId) {
      order.assignedToWorkerId = authUser.id;
      order.assignmentStatus = "assigned";
    }
    await order.save();

    // Free up rider if applicable
    if (authUser.role === "rider") {
      await User.findByIdAndUpdate(authUser.id, { isAvailable: true, status: "available" });
    }

    const orderCode = order.pickupCode || order.code || (order._id ? order._id.toString().slice(-6).toUpperCase() : "");
    const clientUrl = process.env.NEXTAUTH_URL || process.env.CLIENT_URL || "";

    // Send push notification to customer
    if (order.customerId) {
      const isPickup = order.collectionMethod !== "delivery";
      const title = isPickup ? "🛍️ Order Collected!" : "✅ Order Delivered!";
      const body = isPickup
        ? `Your order #${orderCode} has been confirmed as picked up from AMStores. Thank you!`
        : `Your order #${orderCode} was successfully delivered. Thank you!`;
      await sendPushToUser(order.customerId.toString(), title, body, `${clientUrl}/order`).catch(() => {});
    }

    // Broadcast to all connected clients via Socket.io
    const io = (global as any).io;
    if (io) {
      io.emit("order:status", { orderId: order._id.toString(), status: newStatus });
      io.emit("orderUpdated", order);
    }

    // Broadcast via Pusher
    try {
      await pusher.trigger(`order-${order._id}`, "orderUpdated", order);
      await pusher.trigger(`order-${order._id}`, "order:status", { orderId: order._id.toString(), status: newStatus });
      await pusher.trigger("admin-orders", "orderUpdated", order);
      await pusher.trigger("admin-orders", "order:status", { orderId: order._id.toString(), status: newStatus });
    } catch (pushErr: any) {
      console.error("[Pusher] Worker confirm broadcast error:", pushErr.message);
    }

    return NextResponse.json({
      success: true,
      message: `Order #${orderCode} confirmed successfully!`,
      order,
    });
  } catch (err: any) {
    console.error("Worker confirm error:", err);
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
  }
}
