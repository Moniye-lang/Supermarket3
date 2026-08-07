import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { verifyAuth } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Verify authenticated user
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: "You are not authenticated! Please log in." }, { status: 401 });
    }

    const orders = await Order.find({ customerId: authUser.id })
      .sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
