import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { verifyWorker } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Verify worker access (worker, rider, admin)
    const authUser = await verifyWorker(req);
    if (!authUser) {
      return NextResponse.json({ error: "Worker access required!" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const history = searchParams.get("history") === "true";

    let orders = [];

    if (history) {
      // Completed orders either fulfilled by this worker or assigned to this worker (or completed pickup orders for store workers)
      const userObjId = mongoose.Types.ObjectId.isValid(authUser.id)
        ? new mongoose.Types.ObjectId(authUser.id)
        : authUser.id;

      const historyQuery: any = {
        fulfilled: true,
        $or: [
          { fulfilledBy: authUser.id },
          { fulfilledBy: userObjId },
          { assignedToWorkerId: authUser.id },
          { assignedToWorkerId: userObjId },
          { assignedTo: authUser.id },
          { assignedTo: userObjId }
        ]
      };

      if (authUser.role === "worker") {
        historyQuery.$or.push({ collectionMethod: "pickup" }, { collectionMethod: { $ne: "delivery" } });
      } else if (authUser.role === "rider") {
        historyQuery.collectionMethod = "delivery";
      }

      orders = await Order.find(historyQuery)
        .sort({ updatedAt: -1, createdAt: -1 })
        .populate("customerId", "name phone")
        .populate("assignedToWorkerId", "name role status phone");
    } else {
      // Active orders:
      const userObjId = mongoose.Types.ObjectId.isValid(authUser.id)
        ? new mongoose.Types.ObjectId(authUser.id)
        : authUser.id;

      const activeQuery: any = {
        fulfilled: false,
        status: { $nin: ["cancelled", "payment_declined", "delivered", "picked_up", "completed"] }
      };

      if (authUser.role === "rider") {
        // Riders see active delivery orders assigned to them or unassigned delivery orders
        activeQuery.collectionMethod = "delivery";
        activeQuery.$or = [
          { assignedToWorkerId: authUser.id },
          { assignedToWorkerId: userObjId },
          { assignedTo: authUser.id },
          { assignedTo: userObjId },
          { assignedToWorkerId: null },
          { assignedTo: null },
          { assignmentStatus: "unassigned" }
        ];
      } else if (authUser.role === "worker") {
        // In-store staff sees ALL active pickup orders, unassigned orders, and any orders assigned to them
        activeQuery.$or = [
          { collectionMethod: "pickup" },
          { collectionMethod: { $ne: "delivery" } },
          { assignedToWorkerId: authUser.id },
          { assignedToWorkerId: userObjId },
          { assignedTo: authUser.id },
          { assignedTo: userObjId },
          { assignedToWorkerId: null },
          { assignedTo: null },
          { assignmentStatus: "unassigned" }
        ];
      }
      // Admins see all active orders

      orders = await Order.find(activeQuery)
        .sort({ createdAt: -1 })
        .populate("customerId", "name phone")
        .populate("assignedToWorkerId", "name role status phone");
    }

    return NextResponse.json(orders);
  } catch (err: any) {
    console.error("Error fetching worker orders:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
