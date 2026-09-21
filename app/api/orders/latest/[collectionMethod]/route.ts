import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { verifyAuth } from "@/lib/authMiddleware";

export async function GET(req: Request, { params }: { params: Promise<{ collectionMethod: string }> }) {
  try {
    await dbConnect();

    // Verify authenticated user
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: "You are not authenticated! Please log in to view your order status." }, { status: 401 });
    }

    const { collectionMethod } = await params;
    const url = new URL(req.url);
    const orderIdParam = url.searchParams.get("orderId");

    const customerMatch: any = {
      $or: [
        { customerId: authUser.id },
        ...(mongoose.Types.ObjectId.isValid(authUser.id) ? [{ customerId: new mongoose.Types.ObjectId(authUser.id) }] : [])
      ]
    };

    let order = null;

    // 1. If a specific order ID was requested in query:
    if (orderIdParam && mongoose.Types.ObjectId.isValid(orderIdParam)) {
      order = await Order.findOne({
        _id: orderIdParam,
        ...customerMatch
      }).populate("assignedToWorkerId", "name role status phone");
    }

    // 2. Look for the most recent active / unfulfilled order for this customer:
    if (!order) {
      const activeQuery: any = {
        ...customerMatch,
        fulfilled: false,
        status: { $nin: ["cancelled", "payment_declined"] }
      };
      if (collectionMethod && collectionMethod !== "any" && collectionMethod !== "all") {
        activeQuery.collectionMethod = collectionMethod;
      }
      order = await Order.findOne(activeQuery)
        .sort({ createdAt: -1 })
        .populate("assignedToWorkerId", "name role status phone");
    }

    // 3. If collectionMethod was specified and no active order found, try matching that collectionMethod:
    if (!order && collectionMethod && collectionMethod !== "any" && collectionMethod !== "all") {
      order = await Order.findOne({ ...customerMatch, collectionMethod })
        .sort({ createdAt: -1 })
        .populate("assignedToWorkerId", "name role status phone");
    }

    // 4. Absolute fallback: the most recent order ever placed by this user:
    if (!order) {
      order = await Order.findOne(customerMatch)
        .sort({ createdAt: -1 })
        .populate("assignedToWorkerId", "name role status phone");
    }

    if (!order) {
      return NextResponse.json({ error: "No recent order found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
