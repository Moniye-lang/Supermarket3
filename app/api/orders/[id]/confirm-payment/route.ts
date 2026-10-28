import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import { verifyAuth } from "@/lib/authMiddleware";
import { sendPushToUser } from "@/lib/subscriptions";
import pusher from "@/lib/pusher";
import { sendOrderAcceptedEmail, sendPaymentDeclinedEmail } from "@/lib/email";
import { cancelOrder, createOrder, adjustStock, isStoreApiConfigured } from "@/lib/storeApi";


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
    const { action, reason } = await req.json(); // "accept" or "decline"

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
      order.failureReason = null;

      // Sync confirmed order & payment to StoreApp POS if not already assigned a receipt
      if (isStoreApiConfigured() && !order.storeAppReceipt) {
        try {
          const storeItems = (order.items || []).map((it: any) => {
            const rawId = String(it.productId || "").trim();
            let pIdNum = parseInt(rawId.replace(/\D/g, "").slice(-6) || "1", 10);
            if (isNaN(pIdNum) || pIdNum <= 0) pIdNum = 1;
            return {
              productId: pIdNum,
              quantity: Math.max(1, Math.floor(Number(it.qty) || 1)),
              unitPrice: Number(it.price) || 0,
              discount: 0,
            };
          });

          const storePushRes = await createOrder({
            externalRef: order.pickupCode,
            storeId: 1,
            customerName: (order.pickupName || "Storefront Customer").trim(),
            items: storeItems,
            payments: [
              {
                mode: (order.paymentMethod === "card" ? "card" : order.paymentMethod === "cash" ? "cash" : "bank"),
                amount: order.amount,
                reference: order.pickupCode,
              },
            ],
            comments: `Storefront Pickup Order Confirmed - Ref: #${order.pickupCode}`,
          });

          if (storePushRes.success && storePushRes.data) {
            const resData = (storePushRes.data as any)?.data || storePushRes.data;
            if (resData?.storeAppReceipt) order.storeAppReceipt = resData.storeAppReceipt;
            if (resData?.orderId) order.storeAppOrderId = resData.orderId;
            console.log(`[StoreApp POS] Payment accepted & order confirmed on POS! Receipt: ${order.storeAppReceipt}`);
          }
        } catch (storeApiErr: any) {
          console.warn("[StoreApp POS] Failed syncing confirmed order:", storeApiErr.message);
        }
      }

      // Sync local database product stock decrement
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          try {
            const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
            const pId = item.productId;
            const conditions: any[] = [];
            if (pId && mongoose.Types.ObjectId.isValid(pId)) {
              conditions.push({ _id: new mongoose.Types.ObjectId(pId) });
            }
            if (pId) conditions.push({ storeProductId: String(pId) });
            if (item.sku) conditions.push({ sku: item.sku });
            if (item.name) conditions.push({ name: item.name });
            if (conditions.length > 0) {
              await Product.findOneAndUpdate(
                { $or: conditions },
                { $inc: { stock: -qty } }
              );
            }
          } catch (stockErr: any) {
            console.warn("[Confirm Payment] Local product stock decrement error:", stockErr.message);
          }
        }
      }

      const itemsList = (order.items || [])
        .map((it: any) => `${it.qty || 1}x ${it.name || "Item"}`)
        .join(", ");
      
      // Auto-assign worker based on order type (rider for delivery, worker for pickup)
      const targetRole = order.collectionMethod === "delivery" ? "rider" : "worker";
      const availableWorkers = await User.find({ role: targetRole, status: "available" });
      if (availableWorkers && availableWorkers.length > 0) {
        const workersWithWorkload = await Promise.all(
          availableWorkers.map(async (w: any) => {
            const workload = await Order.countDocuments({
              $or: [
                { assignedToWorkerId: w._id },
                { assignedTo: w._id }
              ],
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

        // Notify the worker with product details
        const orderCode = order.pickupCode || order.code || (order._id ? order._id.toString().slice(-6).toUpperCase() : "");
        const workerPayload = {
          title: 'New Order Assigned',
          body: `Order #${orderCode} assigned: ${itemsList || "Products"}.`,
          url: `${clientUrl}/worker`
        };
        await sendPushToUser(selectedWorker._id.toString(), workerPayload.title, workerPayload.body, workerPayload.url).catch(() => {});
      } else {
        order.assignmentStatus = "unassigned";
      }

      await order.save();

      const orderCode = order.pickupCode || order.code || (order._id ? order._id.toString().slice(-6).toUpperCase() : "");

      // Notify customer that payment is accepted and order is packing
      const customerPayload = {
        title: '✅ Payment Confirmed!',
        body: `Your payment for order #${orderCode} has been received! We are now packing your order.`,
        url: `${clientUrl}/order?id=${order._id}`
      };
      await sendPushToUser(order.customerId.toString(), customerPayload.title, customerPayload.body, customerPayload.url).catch(() => {});

      // Send Email Update: Payment Confirmed & Order Accepted
      const customerUser = await User.findById(order.customerId);
      if (customerUser?.email) {
        sendOrderAcceptedEmail(customerUser.email, order, customerUser.name || order.pickupName).catch((emailErr: any) => {
          console.error("[Email] sendOrderAcceptedEmail error:", emailErr.message);
        });
      }

      // Notify other staff about assignment and items
      const staffMembers = await User.find({ role: { $in: ["admin", "worker", "rider"] } });
      for (const staff of staffMembers) {
        if (order.assignedToWorkerId && staff._id.toString() === order.assignedToWorkerId.toString()) continue;
        let title = '🔔 Order Paid & Active';
        let body = `Order #${orderCode} verified: ${itemsList || "Products"}. Status is now packing.`;
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
        await pusher.trigger("admin-orders", "stockUpdated", { orderId: order._id.toString() });
        // Update specific customer
        await pusher.trigger(`order-${order._id}`, "orderUpdated", updated);
        await pusher.trigger(`order-${order._id}`, "order:status", { orderId: order._id.toString(), status: "packing" });
      } catch (pushErr: any) {
        console.error("[Pusher] Accept broadcast error:", pushErr.message);
      }

    } else if (action === "decline") {
      const declineReason = reason || "Payment confirmation declined by admin";
      order.paymentStatus = "declined";
      order.status = "payment_declined";
      order.failureReason = declineReason;

      await order.save();

      // Notify StoreApp POS that the order's payment was declined so it is voided/declined upstream
      if (isStoreApiConfigured() && (order.storeAppOrderId || order.pickupCode)) {
        try {
          const targetRef = order.storeAppOrderId || order.pickupCode;
          await cancelOrder(targetRef, declineReason);
          console.log(`[StoreApp POS] Successfully requested cancellation of declined order #${order.pickupCode}`);
        } catch (storeApiErr: any) {
          console.error(`[StoreApp POS] Failed cancelling declined order #${order.pickupCode}:`, storeApiErr.message);
        }

        // If StoreApp POS had issued a receipt / completed sale for this order,
        // restore the deducted stock back to their inventory via stock adjustments
        if (order.storeAppReceipt && Array.isArray(order.items)) {
          for (const item of order.items) {
            try {
              const pIdNum = parseInt(String(item.productId || item.storeProductId || "1").replace(/\D/g, "").slice(-6) || "1", 10);
              const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
              await adjustStock({
                productId: pIdNum,
                storeId: 1,
                adjustBy: qty,
                adjustmentTypeId: 1,
                remarks: `Restock item from declined order #${order.pickupCode} (Receipt: ${order.storeAppReceipt})`,
              });
              console.log(`[StoreApp POS] Restocked +${qty} units of item ${pIdNum} for declined order #${order.pickupCode}`);
            } catch (stockErr: any) {
              console.warn(`[StoreApp POS] Failed restocking item ${item.name} for declined order:`, stockErr.message);
            }
          }
        }
      }

      // Restock local database items if declined
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          try {
            const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
            const pId = item.productId;
            const conditions: any[] = [];
            if (pId && mongoose.Types.ObjectId.isValid(pId)) {
              conditions.push({ _id: new mongoose.Types.ObjectId(pId) });
            }
            if (pId) conditions.push({ storeProductId: String(pId) });
            if (item.sku) conditions.push({ sku: item.sku });
            if (item.name) conditions.push({ name: item.name });
            if (conditions.length > 0) {
              await Product.findOneAndUpdate(
                { $or: conditions },
                { $inc: { stock: qty } }
              );
            }
          } catch {}
        }
      }

      // Notify customer that payment is declined
      const customerPayload = {
        title: '❌ Payment Verification Failed',
        body: `Your payment was not verified. Please check and try again.`,
        url: `${clientUrl}/order?id=${order._id}`
      };
      await sendPushToUser(order.customerId.toString(), customerPayload.title, customerPayload.body, customerPayload.url).catch(() => {});

      // Send Email Update: Payment Declined
      const customerUser = await User.findById(order.customerId);
      if (customerUser?.email) {
        sendPaymentDeclinedEmail(customerUser.email, order, customerUser.name || order.pickupName).catch((emailErr: any) => {
          console.error("[Email] sendPaymentDeclinedEmail error:", emailErr.message);
        });
      }

      if (io) {
        const updated = await Order.findById(order._id);
        io.emit("orderUpdated", updated);
        io.emit("order:status", { orderId: order._id.toString(), status: "payment_declined" });
      }

      try {
        const updated = await Order.findById(order._id);
        await pusher.trigger("admin-orders", "orderUpdated", updated);
        await pusher.trigger("admin-orders", "order:status", { orderId: order._id.toString(), status: "payment_declined" });
        await pusher.trigger("admin-orders", "stockUpdated", { orderId: order._id.toString() });
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
