import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { verifyAuth } from "@/lib/authMiddleware";
import { sendPushToUser } from "@/lib/subscriptions";
import pusher from "@/lib/pusher";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    // Verify authenticated user
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: "You are not authenticated!" }, { status: 401 });
    }

    if (!["admin", "worker", "rider"].includes(authUser.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const { goodsStatus } = await req.json();

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    order.goodsStatus = goodsStatus || "";
    await order.save();

    // Notify customer about goods update
    const clientUrl = process.env.CLIENT_URL || "";
    const customerPayload = {
      title: '📦 Order Goods Update',
      body: `Status: ${goodsStatus}`,
      url: `${clientUrl}/order`
    };
    await sendPushToUser(order.customerId.toString(), customerPayload.title, customerPayload.body, customerPayload.url).catch(() => {});

    const io = (global as any).io;
    if (io) {
      const updated = await Order.findById(order._id)
        .populate("items.productId")
        .populate("assignedToWorkerId", "name role status phone");
      io.emit("orderUpdated", updated);
      io.emit("order:goods-status", { orderId: order._id.toString(), goodsStatus: order.goodsStatus });
    }

    try {
      const updated = await Order.findById(order._id)
        .populate("items.productId")
        .populate("assignedToWorkerId", "name role status phone");
      await pusher.trigger("admin-orders", "orderUpdated", updated);
      await pusher.trigger(`order-${order._id}`, "orderUpdated", updated);
      await pusher.trigger(`order-${order._id}`, "order:goods-status", { orderId: order._id.toString(), goodsStatus: order.goodsStatus });
    } catch (pushErr: any) {
      console.error("[Pusher] Goods status broadcast error:", pushErr.message);
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
