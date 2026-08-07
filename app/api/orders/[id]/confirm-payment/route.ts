import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
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
    const { action } = await req.json(); // "accept" or "decline"

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (order.paymentStatus !== "verifying") {
      return NextResponse.json({ error: "Order is not in verifying payment status" }, { status: 400 });
    }

    const io = (global as any).io;
    const clientUrl = process.env.CLIENT_URL || "";

    if (action === "accept") {
      order.paymentStatus = "paid";
      order.status = "packing"; // status transitions to packing
      
      // Auto-assign worker
      const availableWorkers = await User.find({ role: { $in: ["worker", "rider"] }, status: "available" });
      if (availableWorkers && availableWorkers.length > 0) {
        const workersWithWorkload = await Promise.all(
          availableWorkers.map(async (w: any) => {
            const workload = await Order.countDocuments({
              assignedToWorkerId: w._id,
              fulfilled: false
            });
            return { worker: w, workload };
          })
        );
        workersWithWorkload.sort((a, b) => a.workload - b.workload);
        const selectedWorker = workersWithWorkload[0].worker;

        order.assignedTo = selectedWorker._id;
        order.assignedToWorkerId = selectedWorker._id;
        order.assignmentMode = "automatic";
        order.assignmentStatus = "assigned";
        order.assignedAt = new Date();

        const timeString = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const logMsg = `Assigned automatically to ${selectedWorker.name} at ${timeString}`;
        order.reassignmentHistory.push({
          assignedWorkerId: selectedWorker._id,
          assignedBy: null,
          assignmentMode: "automatic",
          assignedAt: new Date(),
          logMessage: logMsg
        });

        // Notify the worker
        const workerPayload = {
          title: 'New Order Assigned',
          body: `You have been assigned to order #${order._id}.`,
          url: `${clientUrl}/worker`
        };
        await sendPushToUser(selectedWorker._id.toString(), workerPayload.title, workerPayload.body, workerPayload.url).catch(() => {});
      } else {
        order.assignmentStatus = "unassigned";
      }

      await order.save();

      // Notify customer that payment is accepted and order is packing
      const customerPayload = {
        title: '✅ Payment Confirmed!',
        body: `Your payment has been received! We are now packing your order.`,
        url: `${clientUrl}/order`
      };
      await sendPushToUser(order.customerId.toString(), customerPayload.title, customerPayload.body, customerPayload.url).catch(() => {});

      // Notify other staff about assignment
      const staffMembers = await User.find({ role: { $in: ["admin", "worker", "rider"] } });
      for (const staff of staffMembers) {
        if (order.assignedToWorkerId && staff._id.toString() === order.assignedToWorkerId.toString()) continue;
        let title = '🔔 Order Paid & Active';
        let body = `Order #${order._id} was verified. Status is now packing.`;
        await sendPushToUser(staff._id.toString(), title, body, `${clientUrl}/worker`).catch(() => {});
      }

      if (io) {
        // Populate and emit update
        const updated = await Order.findById(order._id)
          .populate("assignedToWorkerId", "name role status phone");
        io.emit("orderUpdated", updated);
        io.emit("orderCreated", updated); // Emitting to update worker order views as well
        io.emit("order:status", { orderId: order._id.toString(), status: "packing" });
      }

      try {
        const updated = await Order.findById(order._id)
          .populate("assignedToWorkerId", "name role status phone");
        // Update other workers/admins
        await pusher.trigger("admin-orders", "orderUpdated", updated);
        await pusher.trigger("admin-orders", "order:status", { orderId: order._id.toString(), status: "packing" });
        // Update specific customer
        await pusher.trigger(`order-${order._id}`, "orderUpdated", updated);
        await pusher.trigger(`order-${order._id}`, "order:status", { orderId: order._id.toString(), status: "packing" });
      } catch (pushErr: any) {
        console.error("[Pusher] Accept broadcast error:", pushErr.message);
      }

    } else if (action === "decline") {
      order.paymentStatus = "declined";
      order.status = "payment_declined";

      await order.save();

      // Notify customer that payment is declined
      const customerPayload = {
        title: '❌ Payment Verification Failed',
        body: `Your payment was not verified. Please check and try again.`,
        url: `${clientUrl}/order`
      };
      await sendPushToUser(order.customerId.toString(), customerPayload.title, customerPayload.body, customerPayload.url).catch(() => {});

      if (io) {
        const updated = await Order.findById(order._id);
        io.emit("orderUpdated", updated);
        io.emit("order:status", { orderId: order._id.toString(), status: "payment_declined" });
      }

      try {
        const updated = await Order.findById(order._id);
        await pusher.trigger("admin-orders", "orderUpdated", updated);
        await pusher.trigger("admin-orders", "order:status", { orderId: order._id.toString(), status: "payment_declined" });
        await pusher.trigger(`order-${order._id}`, "orderUpdated", updated);
        await pusher.trigger(`order-${order._id}`, "order:status", { orderId: order._id.toString(), status: "payment_declined" });
      } catch (pushErr: any) {
        console.error("[Pusher] Decline broadcast error:", pushErr.message);
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
