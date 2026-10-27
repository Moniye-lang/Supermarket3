import { NextResponse } from "next/server";
import { getOrderById, isStoreApiConfigured } from "@/lib/storeApi";
import { verifyAdmin } from "@/lib/authMiddleware";
import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";

export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  if (!isStoreApiConfigured()) {
    return NextResponse.json({ error: "Store API not configured in .env.local" }, { status: 400 });
  }

  const { orderId } = await params;
  const result = await getOrderById(orderId);

  // Reconcile StoreApp order details with local database record
  if (result && result.data) {
    try {
      await dbConnect();
      const rawOrd = result.data.order || result.data.data || result.data;
      if (rawOrd && typeof rawOrd === "object") {
        const identifiers = [orderId, rawOrd.externalRef, rawOrd.orderId, rawOrd.storeAppOrderId, rawOrd.storeAppReceipt]
          .filter(Boolean)
          .map(String);

        const match = await Order.findOne({
          $or: [
            { pickupCode: { $in: identifiers } },
            { storeAppOrderId: { $in: identifiers } },
            { storeAppReceipt: { $in: identifiers } },
          ],
        }).lean();

        if (match) {
          if (match.paymentStatus === "declined" || match.status === "payment_declined" || match.status === "declined") {
            rawOrd.status = "declined";
            rawOrd.paymentStatus = "declined";
            rawOrd.failureReason = match.failureReason || "Payment confirmation declined by admin";
          } else if (match.status === "cancelled" || match.paymentStatus === "cancelled") {
            rawOrd.status = "cancelled";
            rawOrd.failureReason = match.failureReason || "Order was cancelled";
          } else if (match.paymentStatus === "verifying" || match.status === "payment_pending") {
            if (rawOrd.status === "completed") {
              rawOrd.status = "payment_pending";
            }
          }
        }
      }
    } catch (dbErr: any) {
      console.error("[StoreApp Single Order Reconciliation] Error:", dbErr.message);
    }
  }

  return NextResponse.json(result.data, { status: result.status });
}
