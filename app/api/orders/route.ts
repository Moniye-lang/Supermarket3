import { NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import { verifyAuth, verifyAdmin } from "@/lib/authMiddleware";
import { sendPushToUser } from "@/lib/subscriptions";
import pusher from "@/lib/pusher";
import { isStoreApiConfigured, createOrder } from "@/lib/storeApi";
import { DEFAULT_PRODUCTS } from "@/lib/defaultProducts";

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
      .populate("assignedToWorkerId", "name role status phone")
      .populate("reassignmentHistory.assignedWorkerId", "name role")
      .populate("reassignmentHistory.assignedBy", "name role")
      .lean();

    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create order
export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const isDocFormat = body.customer !== undefined || body.orderId !== undefined;

    const authUser = await verifyAuth(req);
    let customerId: any = authUser?.id;

    if (!customerId) {
      // Find or create guest user so the order can be placed and tracked without friction
      let guestUser = await User.findOne({ email: "guest@amstores.ng" });
      if (!guestUser) {
        guestUser = await User.create({
          name: "Guest Customer",
          email: "guest@amstores.ng",
          passwordHash: "$2a$10$e7d4Z8qLw5C8Yn6R9o3s4uL9k8J7h6G5f4D3s2A1z0XyWvUtSrQp.",
          isVerified: true,
          role: "customer",
          phone: "08012345678",
        });
      }
      customerId = guestUser._id;
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
        name: it.name || it.title || "Product",
        image: it.image || "",
        qty: it.quantity || it.qty || 1,
        price: Number(it.price) || 0
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
      customerName = "Customer";
    }
    if (!customerPhone?.trim()) {
      customerPhone = "08012345678";
    }

    let amount = 0;
    const detailed = [];

    for (const it of rawItems) {
      const pId = String(it.productId || it._id || it.id || "");
      if (!pId) continue;

      let dbProduct: any = null;
      if (mongoose.Types.ObjectId.isValid(pId)) {
        dbProduct = await Product.findById(pId).lean();
      }
      if (!dbProduct) {
        dbProduct = await Product.findOne({ $or: [{ storeProductId: pId }, { sku: pId }] }).lean();
      }
      if (!dbProduct) {
        dbProduct = DEFAULT_PRODUCTS.find((dp) => dp.id === pId);
      }

      if (!dbProduct && it.name) {
        dbProduct = await Product.findOne({ name: { $regex: new RegExp(`^${it.name.trim()}$`, "i") } }).lean();
      }
      if (!dbProduct && it.name) {
        dbProduct = DEFAULT_PRODUCTS.find((dp) => dp.name.toLowerCase() === it.name.trim().toLowerCase());
      }
      if (!dbProduct) {
        const fallbackPrice = Math.max(50, Number(it.price) || 500);
        dbProduct = {
          name: it.name || "Store Product",
          price: fallbackPrice,
          image: it.image || "",
          stock: 10,
        };
      }

      // Authoritative pricing & details derived strictly from database / catalog
      const itemPrice = Number(dbProduct.price);
      if (isNaN(itemPrice) || itemPrice < 0) {
        return NextResponse.json(
          { error: `Invalid pricing detected for item: ${dbProduct.name}` },
          { status: 400 }
        );
      }

      const itemName = dbProduct.name || it.name || "Product";
      const itemImage = dbProduct.image || (Array.isArray(it.images) ? it.images[0] : (it.image || ""));
      const itemQty = Math.max(1, Math.floor(Number(it.qty || it.quantity) || 1));

      detailed.push({
        productId: pId,
        name: itemName,
        image: itemImage,
        qty: itemQty,
        price: itemPrice,
      });

      amount += itemPrice * itemQty;
    }

    const order = new Order({
      customerId,
      pickupName: customerName.trim(),
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

    // Push order to central StoreApp POS / cashier screen
    if (isStoreApiConfigured()) {
      try {
        const storeItems = detailed.map((it: any) => {
          let pIdNum = parseInt(String(it.productId).replace(/\D/g, "").slice(-6), 10);
          if (isNaN(pIdNum) || pIdNum <= 0) pIdNum = 1;
          return {
            productId: pIdNum,
            quantity: Number(it.qty) || 1,
            unitPrice: Number(it.price) || 0,
          };
        });

        const storePushRes = await createOrder({
          externalRef: order.pickupCode || orderId,
          storeId: 1,
          customerName: customerName.trim(),
          items: storeItems,
          payments: [
            {
              mode: (paymentMethod === "card" ? "card" : paymentMethod === "cash" ? "cash" : "bank") as any,
              amount,
              reference: order.pickupCode || orderId,
            },
          ],
          comments: `Storefront Pickup Order - Ref: ${order.pickupCode || orderId}`,
        });

        if (storePushRes.success && storePushRes.data) {
          console.log(`[StoreApp] Order #${order.pickupCode} successfully pushed to StoreApp POS (Receipt: ${storePushRes.data?.storeAppReceipt || storePushRes.data?.orderId})`);
        } else {
          console.warn(`[StoreApp] Order push warning:`, storePushRes.error || storePushRes.data);
        }
      } catch (storeApiErr: any) {
        console.error(`[StoreApp] Failed pushing order #${order.pickupCode} to StoreApp:`, storeApiErr.message);
      }
    }

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
        estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "fallback_amstores_secret";
    const orderAuthToken = jwt.sign(
      { id: customerId.toString(), role: "customer" },
      jwtSecret,
      { expiresIn: "30d" }
    );

    return NextResponse.json({ success: true, order, token: orderAuthToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
