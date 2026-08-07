import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { verifyAdmin } from "@/lib/authMiddleware";
import { sendPushToUser } from "@/lib/subscriptions";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    // Verify Admin
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required!" }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await req.json();

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (status) {
      order.status = status;
      if (status === "completed" || status === "delivered") {
        order.fulfilled = true;
      } else {
        order.fulfilled = false;
      }
    }

    await order.save();
    
    // Notify owner about status change
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const statusPayload = {
      title: 'Order Status Updated',
      body: `Your order #${order._id} status is now ${order.status}.`,
      url: `${clientUrl}/orders/${order._id}`
    };
    await sendPushToUser(order.customerId.toString(), statusPayload.title, statusPayload.body, statusPayload.url).catch(() => {});

    const updatedOrder = await Order.findById(order._id)
      .populate("assignedToWorkerId", "name role status phone")
      .populate("reassignmentHistory.assignedWorkerId", "name role")
      .populate("reassignmentHistory.assignedBy", "name role");

    const io = (global as any).io;
    if (io) {
      io.emit("orderUpdated", updatedOrder);
      io.emit("order:status", { orderId: order._id.toString(), status: order.status });
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
