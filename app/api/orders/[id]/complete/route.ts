import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { verifyAuth } from "@/lib/authMiddleware";
import { sendPushToUser } from "@/lib/subscriptions";
import pusher from "@/lib/pusher";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // IDOR Protection: Ensure requester is the owner or staff
    const isOwner = order.customerId && order.customerId.toString() === authUser.id;
    const isStaff = ["admin", "worker", "rider"].includes(authUser.role);
    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "You are not authorized to complete this order" }, { status: 403 });
    }

    order.fulfilled = true;
    order.status = "delivered";
    await order.save();

    // Notify owner about completion
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const completePayload = {
      title: 'Order Completed',
      body: `Your order #${order._id} has been delivered.`,
      url: `${clientUrl}/orders/${order._id}`
    };
    await sendPushToUser(order.customerId.toString(), completePayload.title, completePayload.body, completePayload.url).catch(() => {});

    const io = (global as any).io;
    if (io) {
      io.emit("order:status", { orderId: id, status: "delivered" });
    }

    try {
      await pusher.trigger("admin-orders", "order:status", { orderId: id, status: "delivered" });
      await pusher.trigger(`order-${id}`, "order:status", { orderId: id, status: "delivered" });
    } catch (pushErr: any) {
      console.error("[Pusher] Order completion broadcast error:", pushErr.message);
    }

    return NextResponse.json({ success: true, message: "Order marked as completed", order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
