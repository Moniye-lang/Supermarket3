import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import { verifyAuth, verifyAdmin } from "@/lib/authMiddleware";
import { sendPushToUser } from "@/lib/subscriptions";
import { sendOrderReadyEmail } from "@/lib/email";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const order = await Order.findById(id)
      .populate("assignedToWorkerId", "name role status phone")
      .populate("reassignmentHistory.assignedWorkerId", "name role")
      .populate("reassignmentHistory.assignedBy", "name role");

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Access control: customer who owns the order, worker/rider, or admin
    if (
      authUser.role === "customer" &&
      order.customerId &&
      order.customerId.toString() !== authUser.id
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
      if (status === "completed" || status === "delivered" || status === "picked_up") {
        order.fulfilled = true;
      } else {
        order.fulfilled = false;
      }
    }

    await order.save();
    
    // Notify owner about status change
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5000";
    const statusPayload = {
      title: 'Order Status Updated',
      body: `Your order #${order.pickupCode || order._id} status is now ${order.status}.`,
      url: `${clientUrl}/order`
    };
    if (order.customerId) {
      await sendPushToUser(order.customerId.toString(), statusPayload.title, statusPayload.body, statusPayload.url).catch(() => {});
    }

    // Send Email Update: Order Ready
    if (status === "ready_for_pickup" || status === "ready") {
      const customerUser = await User.findById(order.customerId);
      if (customerUser?.email) {
        sendOrderReadyEmail(customerUser.email, order, customerUser.name || order.pickupName).catch((emailErr: any) => {
          console.error("[Email] sendOrderReadyEmail error:", emailErr.message);
        });
      }
    }

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
