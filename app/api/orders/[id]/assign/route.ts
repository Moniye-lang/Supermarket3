import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
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
    const { workerId } = await req.json(); // Can be null/empty string to unassign

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    let logMsg = "";
    const timeString = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (!workerId) {
      // Unassign
      order.assignedTo = null;
      order.assignedToWorkerId = null;
      order.assignmentMode = "manual";
      order.assignmentStatus = "unassigned";
      order.assignedAt = null;
      if (!order.fulfilled) {
        order.status = "pending";
      }

      logMsg = `Unassigned manually by Admin at ${timeString}`;
      order.reassignmentHistory.push({
        assignedWorkerId: null,
        assignedBy: adminUser.id,
        assignmentMode: "manual",
        assignedAt: new Date(),
        logMessage: logMsg
      });
    } else {
      // Assign or Reassign
      const worker = await User.findById(workerId);
      if (!worker) return NextResponse.json({ error: "Worker not found" }, { status: 404 });
      if (!["worker", "rider"].includes(worker.role)) {
        return NextResponse.json({ error: "Selected user is not a valid worker or rider" }, { status: 400 });
      }

      const isReassignment = order.assignedToWorkerId ? true : false;

      order.assignedTo = worker._id;
      order.assignedToWorkerId = worker._id;
      order.assignmentMode = "manual";
      order.assignmentStatus = "assigned";
      order.assignedAt = new Date();
      order.status = "processing";

      logMsg = `${isReassignment ? "Reassigned" : "Assigned"} manually by Admin at ${timeString}`;
      order.reassignmentHistory.push({
        assignedWorkerId: worker._id,
        assignedBy: adminUser.id,
        assignmentMode: "manual",
        assignedAt: new Date(),
        logMessage: logMsg
      });
    }

    await order.save();

    // Notify owner about assignment status
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const ownerPayload = {
      title: 'Order Assignment Update',
      body: `Your order #${order._id} has been ${order.assignmentStatus}.`,
      url: `${clientUrl}/orders/${order._id}`
    };
    await sendPushToUser(order.customerId.toString(), ownerPayload.title, ownerPayload.body, ownerPayload.url).catch(() => {});

    // If assigned to a worker, notify the worker
    if (order.assignedToWorkerId) {
      const workerPayload = {
        title: 'New Order Assigned',
        body: `You have been assigned to order #${order._id}.`,
        url: `${clientUrl}/worker/orders/${order._id}`
      };
      await sendPushToUser(order.assignedToWorkerId.toString(), workerPayload.title, workerPayload.body, workerPayload.url).catch(() => {});
    }

    // Populate details
    const updatedOrder = await Order.findById(order._id)
      .populate("assignedToWorkerId", "name role status phone")
      .populate("reassignmentHistory.assignedWorkerId", "name role")
      .populate("reassignmentHistory.assignedBy", "name role");

    const io = (global as any).io;
    if (io) {
      io.emit("orderUpdated", updatedOrder);
      io.emit("order:status", { orderId: order._id.toString(), status: order.status });
    }

    return NextResponse.json({ success: true, order: updatedOrder, message: logMsg });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
