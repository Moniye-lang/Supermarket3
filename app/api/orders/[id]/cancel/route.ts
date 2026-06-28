import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { verifyAuth } from "@/lib/authMiddleware";
import { sendPushToUser } from "@/lib/subscriptions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    // Verify authenticated user
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: "You are not authenticated!" }, { status: 401 });
    }

    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // IDOR check: only customer owner or admin can cancel
    if (order.customerId.toString() !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only allow cancelling in "packing" status
    if (order.status !== "packing") {
      return NextResponse.json({ error: "Orders can only be cancelled during the packing status." }, { status: 400 });
    }

    order.status = "cancelled";
    order.paymentStatus = "cancelled";
    
    // Log in history
    const timeString = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    order.reassignmentHistory.push({
      assignedWorkerId: null,
      assignedBy: authUser.id,
      assignmentMode: "manual",
      assignedAt: new Date(),
      logMessage: `Cancelled by Customer/Admin at ${timeString}`
    });

    await order.save();

    // If worker assigned, notify them about cancellation
    if (order.assignedToWorkerId) {
      const clientUrl = process.env.CLIENT_URL || "";
      await sendPushToUser(
        order.assignedToWorkerId.toString(),
        "❌ Order Cancelled",
        `Order #${order.pickupCode} has been cancelled by the customer.`,
        `${clientUrl}/worker`
      ).catch(() => {});
    }

    const io = (global as any).io;
    if (io) {
      const updated = await Order.findById(order._id)
        .populate("items.productId")
        .populate("assignedToWorkerId", "name role status phone");
      io.emit("orderUpdated", updated);
      io.emit("order:status", { orderId: order._id.toString(), status: "cancelled" });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
