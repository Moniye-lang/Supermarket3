import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import { verifyWorker } from "@/lib/authMiddleware";

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
      return NextResponse.json({ error: "Order ID and code are required." }, { status: 400 });
    }

    // Find order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Verify code
    if (order.pickupCode.trim() !== code.trim()) {
      return NextResponse.json({ error: "Code not matching." }, { status: 400 });
    }

    if (order.fulfilled) {
      return NextResponse.json({ error: "Order already fulfilled." }, { status: 400 });
    }

    // Mark as fulfilled
    order.fulfilled = true;
    order.fulfilledBy = authUser.id; // record who confirmed it
    order.fulfilledAt = new Date();
    order.status = "delivered";
    await order.save();

    // Free up rider if applicable
    if (authUser.role === "rider") {
      await User.findByIdAndUpdate(authUser.id, { isAvailable: true });
    }

    // Broadcast to all connected clients so dashboards update instantly
    const io = (global as any).io;
    if (io) {
      io.emit("order:status", { orderId: order._id.toString(), status: "delivered" });
    }

    return NextResponse.json({
      success: true,
      message: `Order confirmed by ${authUser.role}.`,
      order,
    });
  } catch (err: any) {
    console.error("Worker confirm error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
