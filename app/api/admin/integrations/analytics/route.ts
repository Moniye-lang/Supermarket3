import { NextResponse } from "next/server";
import { getAnalytics, syncAnalytics, isStoreApiConfigured } from "@/lib/storeApi";
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
  const from = searchParams.get("from") || searchParams.get("startDate") || undefined;
  const to = searchParams.get("to") || searchParams.get("endDate") || undefined;
  const period = searchParams.get("period") || searchParams.get("groupBy") || undefined;

  const result = await getAnalytics({ from, to, period });
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

  const result = await syncAnalytics(body);
  return NextResponse.json(result.data, { status: result.status });
}
