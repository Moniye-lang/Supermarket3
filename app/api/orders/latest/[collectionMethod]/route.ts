import { NextResponse } from "next/server";
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
    const order = await Order.findOne({ customerId: authUser.id, collectionMethod })
      .sort({ createdAt: -1 })
      .populate("assignedToWorkerId", "name role status phone");

    if (!order) {
      return NextResponse.json({ error: "No recent order found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
