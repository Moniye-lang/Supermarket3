import { NextResponse } from "next/server";
import { getOrders, createOrder, isStoreApiConfigured } from "@/lib/storeApi";
import { verifyAdmin } from "@/lib/authMiddleware";

import dbConnect from "@/lib/mongodb";
import Order from "@/lib/models/Order";

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  if (!isStoreApiConfigured()) {
    return NextResponse.json({ error: "Store API not configured in .env.local" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;
  const status = searchParams.get("status") || undefined;

  const result = await getOrders({ page, limit, status });

  // Reconcile StoreApp orders with local database records (e.g. payment confirmations, declines, cancellations)
  if (result && result.data) {
    try {
      await dbConnect();

      let orderList: any[] = [];
      if (Array.isArray(result.data)) {
        orderList = result.data;
      } else if (result.data?.orders && Array.isArray(result.data.orders)) {
        orderList = result.data.orders;
      } else if (result.data?.data?.orders && Array.isArray(result.data.data.orders)) {
        orderList = result.data.data.orders;
      } else if (Array.isArray(result.data?.data)) {
        orderList = result.data.data;
      }

      if (orderList.length > 0) {
        const identifiers = orderList
          .flatMap((o: any) => [o.externalRef, o.orderId, o.storeAppOrderId, o.storeAppReceipt])
          .filter(Boolean)
          .map(String);

        const localOrders = await Order.find({
          $or: [
            { pickupCode: { $in: identifiers } },
            { storeAppOrderId: { $in: identifiers } },
            { storeAppReceipt: { $in: identifiers } },
          ],
        }).lean();

        const localByRef = new Map<string, any>();
        for (const lo of localOrders) {
          if (lo.pickupCode) localByRef.set(String(lo.pickupCode), lo);
          if (lo.storeAppOrderId) localByRef.set(String(lo.storeAppOrderId), lo);
          if (lo.storeAppReceipt) localByRef.set(String(lo.storeAppReceipt), lo);
        }

        for (const ord of orderList) {
          const match =
            (ord.externalRef && localByRef.get(String(ord.externalRef))) ||
            (ord.orderId && localByRef.get(String(ord.orderId))) ||
            (ord.storeAppOrderId && localByRef.get(String(ord.storeAppOrderId))) ||
            (ord.storeAppReceipt && localByRef.get(String(ord.storeAppReceipt)));

          if (match) {
            // When payment confirmation was declined by the admin
            if (match.paymentStatus === "declined" || match.status === "payment_declined" || match.status === "declined") {
              ord.status = "declined";
              ord.paymentStatus = "declined";
              ord.failureReason = match.failureReason || "Payment confirmation declined by admin";
            } else if (match.status === "cancelled" || match.paymentStatus === "cancelled") {
              ord.status = "cancelled";
              ord.failureReason = match.failureReason || "Order was cancelled";
            } else if (match.paymentStatus === "verifying" || match.status === "payment_pending") {
              if (ord.status === "completed") {
                ord.status = "payment_pending";
              }
            }
          }
        }

        if (status) {
          const filtered = orderList.filter((o: any) => o.status === status);
          if (Array.isArray(result.data)) {
            result.data = filtered;
          } else if (result.data?.orders && Array.isArray(result.data.orders)) {
            result.data.orders = filtered;
          } else if (result.data?.data?.orders && Array.isArray(result.data.data.orders)) {
            result.data.data.orders = filtered;
          } else if (Array.isArray(result.data?.data)) {
            result.data.data = filtered;
          }
        }
      }
    } catch (dbErr: any) {
      console.error("[StoreApp Orders Reconciliation Error]:", dbErr.message);
    }
  }

  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  if (!isStoreApiConfigured()) {
    return NextResponse.json({ error: "Store API not configured in .env.local" }, { status: 400 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await createOrder(body);
  return NextResponse.json(result.data, { status: result.status });
}
