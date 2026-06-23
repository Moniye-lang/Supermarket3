import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import { verifyAuth, verifyAdmin } from "@/lib/authMiddleware";
import { sendPushToUser } from "@/lib/subscriptions";

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

// POST: Create order (Auth required)
export async function POST(req: Request) {
  try {
    await dbConnect();

    // Verify authenticated user
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: "You are not authenticated!" }, { status: 401 });
    }

    const { items, deliveryAddress, collectionMethod, customerName, paymentMethod, customerPhone } = await req.json();

    if (!items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }
    if (!customerName?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let amount = 0;
    const detailed = [];

    for (const it of items) {
      const p = await Product.findById(it.productId);
      if (!p) {
        return NextResponse.json({ error: `Product ${it.productId} not found` }, { status: 404 });
      }

      detailed.push({ productId: p._id, qty: it.qty, price: p.price });
      amount += p.price * it.qty;
    }

    const order = new Order({
      customerId: authUser.id,
      pickupName: customerName.trim(), // store customerName in DB as pickupName
      items: detailed,
      amount,
      deliveryAddress: deliveryAddress || "N/A",
      customerPhone,
      collectionMethod,
      paymentMethod: paymentMethod || "manual_transfer",
      pickupCode: generateCode(),
      fulfilled: false,
      paymentStatus: "verifying",
      status: "payment_pending",
      assignmentStatus: "unassigned"
    });

    await order.save();

    // Broadcast new order to admins and workers via global Socket.io instance
    const io = (global as any).io;
    if (io) {
      io.emit("paymentVerificationRequest", order);
      io.emit("orderCreated", order);
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

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
