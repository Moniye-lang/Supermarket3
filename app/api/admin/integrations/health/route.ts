import { NextResponse } from "next/server";
import { checkHealth, isStoreApiConfigured, getStoreApiConfig } from "@/lib/storeApi";
import { verifyAdmin } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  const adminCheck = verifyAdmin(req);
  if (adminCheck) return adminCheck;

  if (!isStoreApiConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        status: "unconfigured",
        message: "STORE_API_URL or STORE_API_SECRET is not configured in .env.local",
      },
      { status: 200 }
    );
  }

  const startTime = Date.now();
  const res = await checkHealth();
  const latencyMs = Date.now() - startTime;
  const config = getStoreApiConfig();

  return NextResponse.json({
    configured: true,
    baseUrl: config.baseUrl,
    healthy: res.success,
    latencyMs,
    status: res.status,
    response: res.data,
    error: res.error,
  });
}
