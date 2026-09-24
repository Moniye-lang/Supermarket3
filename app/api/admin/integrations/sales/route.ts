import { NextResponse } from "next/server";
import { getSales, syncSales, isStoreApiConfigured } from "@/lib/storeApi";
import { verifyAdmin } from "@/lib/authMiddleware";

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
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const result = await getSales({ page, limit, startDate, endDate });
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

  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const result = await syncSales(body);
  return NextResponse.json(result.data, { status: result.status });
}
