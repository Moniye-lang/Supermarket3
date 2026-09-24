import { NextResponse } from "next/server";
import { getCatalogSyncStatus, isStoreApiConfigured } from "@/lib/storeApi";
import { verifyAdmin } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  if (!isStoreApiConfigured()) {
    return NextResponse.json({ error: "Store API not configured in .env.local" }, { status: 400 });
  }

  const result = await getCatalogSyncStatus();
  return NextResponse.json(result.data, { status: result.status });
}
