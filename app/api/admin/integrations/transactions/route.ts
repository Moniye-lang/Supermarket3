import { NextResponse } from "next/server";
import { getTransactions, syncTransactions, isStoreApiConfigured } from "@/lib/storeApi";
import { verifyAdmin } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  const adminCheck = verifyAdmin(req);
  if (adminCheck) return adminCheck;

  if (!isStoreApiConfigured()) {
    return NextResponse.json({ error: "Store API not configured in .env.local" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;
  const status = searchParams.get("status") || undefined;

  const result = await getTransactions({ page, limit, status });
  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(req: Request) {
  const adminCheck = verifyAdmin(req);
  if (adminCheck) return adminCheck;

  if (!isStoreApiConfigured()) {
    return NextResponse.json({ error: "Store API not configured in .env.local" }, { status: 400 });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const result = await syncTransactions(body);
  return NextResponse.json(result.data, { status: result.status });
}
