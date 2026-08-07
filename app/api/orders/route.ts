import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import { verifyAuth, verifyAdmin } from "@/lib/authMiddleware";
import { sendPushToUser } from "@/lib/subscriptions";
import pusher from "@/lib/pusher";

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// GET all orders (Admin-only)
export async function GET(req: Request) {
  try {
    await dbConnect();

    // Verify Admin
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required!" }, { status: 403 });
    }

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("items.productId")
      .populate("assignedToWorkerId", "name role status phone")
      .populate("reassignmentHistory.assignedWorkerId", "name role")
      .populate("reassignmentHistory.assignedBy", "name role");

    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create order (Auth optional / document-compliant format supported)
export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const isDocFormat = body.customer !== undefined || body.orderId !== undefined;

    const authUser = await verifyAuth(req);
    let customerId = authUser?.id;

    if (!customerId) {
      const dummyUser = await User.findOne({ role: "customer" }) || await User.findOne({});
      if (dummyUser) {
        customerId = dummyUser._id.toString();
      } else {
        const dummy = new User({
          name: isDocFormat ? (body.customer || "Demo User") : "Demo User",
          email: "demo@example.com",
          passwordHash: "dummy",
          role: "customer"
        });
        await dummy.save();
        customerId = dummy._id.toString();
      }
    }

    let rawItems: any[] = [];
    let deliveryAddress = "";
    let collectionMethod = "delivery";
    let customerName = "";
    let paymentMethod = "manual_transfer";
    let customerPhone = "";
    let orderId = body.orderId || generateCode();

    if (isDocFormat) {
      customerName = body.customer || "Demo User";
      deliveryAddress = body.address || "N/A";
      collectionMethod = body.pickup ? "pickup" : "delivery";
      rawItems = (body.items || []).map((it: any) => ({
        productId: it.productId,
        qty: it.quantity || it.qty || 1,
        price: it.price
      }));
    } else {
      customerName = body.customerName;
      deliveryAddress = body.deliveryAddress;
      collectionMethod = body.collectionMethod;
      rawItems = body.items || [];
      paymentMethod = body.paymentMethod;
      customerPhone = body.customerPhone;
    }

    if (!rawItems?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }
    if (!customerName?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let amount = 0;
    const detailed = [];

    for (const it of rawItems) {
      const pId = it.productId || it._id || it.id;
      let itemPrice = typeof it.price === "number" ? it.price : 0;

      if (!itemPrice && mongoose.Types.ObjectId.isValid(pId)) {
        const p = await Product.findById(pId);
        if (p) itemPrice = p.price;
      }

      const itemQty = Number(it.qty || it.quantity) || 1;
      detailed.push({ productId: pId, qty: itemQty, price: itemPrice });
      amount += itemPrice * itemQty;
    }

    const order = new Order({
      customerId,
      pickupName: customerName.trim(), // store customerName in DB as pickupName
      items: detailed,
      amount,
      deliveryAddress: deliveryAddress || "N/A",
      customerPhone,
      collectionMethod,
      paymentMethod: paymentMethod || "manual_transfer",
      pickupCode: orderId,
      fulfilled: false,
      paymentStatus: "verifying",
      status: "payment_pending",
      assignmentStatus: "unassigned",
      latitude: body.latitude || null,
      longitude: body.longitude || null
    });

    await order.save();

    // Broadcast new order to admins and workers via global Socket.io instance
    const io = (global as any).io;
    if (io) {
      io.emit("paymentVerificationRequest", order);
      io.emit("orderCreated", order);
    }

    // Broadcast via Pusher to admin-orders channel for real-time frontend updates
    try {
      await pusher.trigger("admin-orders", "orderCreated", order);
      await pusher.trigger("admin-orders", "paymentVerificationRequest", order);
      console.log(`[Pusher] Triggered orderCreated & paymentVerificationRequest for order #${order.pickupCode}`);
    } catch (pushErr: any) {
      console.error("[Pusher] Failed to broadcast order creation:", pushErr.message);
    }

    // Let's notify admin/worker about payment verification request via Push
    const staffMembers = await User.find({ role: { $in: ["admin", "worker"] } });
    for (const staff of staffMembers) {
      await sendPushToUser(
        staff._id.toString(),
        "💰 Payment verification needed",
        `Order #${order.pickupCode} needs payment confirmation.`,
        staff.role === 'admin' ? '/admin' : '/worker'
      ).catch((err) => console.error("Push error:", err.message));
    }

    if (isDocFormat) {
      return NextResponse.json({
        success: true,
        orderId,
        message: "Order successfully created",
        total: amount,
        estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
      });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
