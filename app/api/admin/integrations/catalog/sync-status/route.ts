import { NextResponse } from "next/server";
import { getCatalogSyncStatus, isStoreApiConfigured } from "@/lib/storeApi";
import { verifyAdmin } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  const adminCheck = verifyAdmin(req);
  if (adminCheck) return adminCheck;

  if (!isStoreApiConfigured()) {
    return NextResponse.json({ error: "Store API not configured in .env.local" }, { status: 400 });
  }

  const result = await getCatalogSyncStatus();
  return NextResponse.json(result.data, { status: result.status });
}
