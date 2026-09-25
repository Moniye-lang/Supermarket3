import { NextResponse } from "next/server";
import { updateAdminIntegration, deleteAdminIntegration, isStoreApiConfigured } from "@/lib/storeApi";
import { verifyAdmin } from "@/lib/authMiddleware";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  if (!isStoreApiConfigured()) {
    return NextResponse.json({ error: "Store API not configured in .env.local" }, { status: 400 });
  }

  const { id } = await params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const result = await updateAdminIntegration(id, body);
  return NextResponse.json(result.data, { status: result.status });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  if (!isStoreApiConfigured()) {
    return NextResponse.json({ error: "Store API not configured in .env.local" }, { status: 400 });
  }

  const { id } = await params;
  const result = await deleteAdminIntegration(id);
  return NextResponse.json(result.data, { status: result.status });
}
