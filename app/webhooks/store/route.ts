import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, tenantId, timestamp, data } = body;

    console.log(`[StoreApp Webhook] Event: ${event} | Tenant: ${tenantId}`, {
      timestamp,
      data,
    });

    // Handle supported event types from StoreApp POS
    switch (event) {
      case "sale.created":
        // POS recorded a sale -> e.g. receiptNo, total, items, paymentMode
        break;

      case "order.completed":
        // POS confirmed order -> storeAppReceipt number assigned
        break;

      case "order.failed":
        // POS order failed
        break;

      case "catalog.synced":
        // POS refreshed catalog snapshot
        break;

      case "stock.synced":
        // POS refreshed stock snapshot
        break;

      default:
        console.log(`[StoreApp Webhook] Unhandled event: ${event}`);
    }

    return NextResponse.json({ success: true, received: true }, { status: 200 });
  } catch (err: any) {
    console.error("[StoreApp Webhook Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "/webhooks/store" }, { status: 200 });
}
