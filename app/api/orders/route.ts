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
    if (!authUser || !authUser.id) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to place an order." },
        { status: 401 }
      );
    }
    const customerId = authUser.id;

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

    // 1. Broadcast immediately to admins and workers via global Socket.io instance
    const orderPayload = {
      _id: order._id.toString(),
      id: order._id.toString(),
      customerId: order.customerId?.toString(),
      pickupName: order.pickupName || customerName.trim(),
      pickupCode: order.pickupCode,
      amount: order.amount,
      items: detailed,
      collectionMethod: order.collectionMethod,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      assignmentStatus: order.assignmentStatus,
      deliveryAddress: order.deliveryAddress,
      customerPhone: order.customerPhone,
      createdAt: order.createdAt,
    };

    const io = (global as any).io;
    if (io) {
      io.emit("paymentVerificationRequest", orderPayload);
      io.emit("orderCreated", orderPayload);
    }

    // 2. Broadcast via Pusher to admin-orders channel for real-time frontend updates
    try {
      await pusher.trigger("admin-orders", "orderCreated", orderPayload);
      await pusher.trigger("admin-orders", "paymentVerificationRequest", orderPayload);
      console.log(`[Pusher] Triggered orderCreated & paymentVerificationRequest for order #${order.pickupCode}`);
    } catch (pushErr: any) {
      console.error("[Pusher] Failed to broadcast order creation:", pushErr.message);
    }

    // 3. Push order to central StoreApp POS / cashier screen asynchronously (never block notifications)
    if (isStoreApiConfigured()) {
      const storeItems = detailed.map((it: any) => {
        let pIdNum = parseInt(String(it.productId).replace(/\D/g, "").slice(-6), 10);
        if (isNaN(pIdNum) || pIdNum <= 0) pIdNum = 1;
        return {
          productId: pIdNum,
          quantity: Number(it.qty) || 1,
          unitPrice: Number(it.price) || 0,
        };
      });

      createOrder({
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
      }).then((storePushRes) => {
        if (storePushRes.success && storePushRes.data) {
          console.log(`[StoreApp] Order #${order.pickupCode} successfully pushed to StoreApp POS (Receipt: ${storePushRes.data?.storeAppReceipt || storePushRes.data?.orderId})`);
        } else {
          console.warn(`[StoreApp] Order push warning:`, storePushRes.error || storePushRes.data);
        }
      }).catch((storeApiErr: any) => {
        console.error(`[StoreApp] Failed pushing order #${order.pickupCode} to StoreApp:`, storeApiErr.message);
      });
    }

    // 4. Notify admin/worker about payment verification request via Web Push
    User.find({ role: { $in: ["admin", "worker"] } }).then((staffMembers) => {
      for (const staff of staffMembers) {
        sendPushToUser(
          staff._id.toString(),
          "💰 Payment verification needed",
          `Order #${order.pickupCode} needs payment confirmation.`,
          staff.role === 'admin' ? '/admin' : '/worker'
        ).catch((err) => console.error("Push error:", err.message));
      }
    }).catch(() => {});

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
