import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, tenantId, timestamp, data } = body;

    console.log(`[StoreApp Webhook] Received event: ${event} for tenant: ${tenantId}`, { timestamp, data });

    // Handle supported event types
    switch (event) {
      case "sale.created":
        // POS recorded a sale -> update local statistics or notification
        break;

      case "order.completed":
        // POS confirmed order -> update order status and receipt
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
        console.log(`[StoreApp Webhook] Unhandled event type: ${event}`);
    }

    return NextResponse.json({ success: true, received: true }, { status: 200 });
  } catch (err: any) {
    console.error("[StoreApp Webhook Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
