import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { verifyWorker } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Verify worker access
    const authUser = await verifyWorker(req);
    if (!authUser) {
      return NextResponse.json({ error: "Worker access required!" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const history = searchParams.get("history") === "true";

    // Query active or completed orders assigned to the logged-in worker
    const query = { fulfilled: history, assignedToWorkerId: authUser.id };

    const orders = await Order.find(query)
      .sort({ updatedAt: -1 })
      .populate("customerId", "name phone");

    return NextResponse.json(orders);
  } catch (err: any) {
    console.error("Error fetching worker orders:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
