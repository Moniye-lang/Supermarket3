import { NextResponse } from "next/server";
import { getStoreApiConfig, isStoreApiConfigured, getCatalog } from "@/lib/storeApi";

export async function GET() {
  const config = getStoreApiConfig();
  const configured = isStoreApiConfigured();

  let catalogTest: any = null;
  let testError: string | null = null;

  try {
    const res = await getCatalog({ pageSize: 5 });
    catalogTest = {
      status: res.status,
      success: res.success,
      productCount: res?.data?.data?.products?.length || res?.data?.products?.length || 0,
      sampleProduct: res?.data?.data?.products?.[0]?.name || res?.data?.products?.[0]?.name || null,
      rawError: res.error || null,
    };
  } catch (err: any) {
    testError = err.message || "Unknown error during catalog test";
  }

  return NextResponse.json(
    {
      environment: {
        isStoreApiConfigured: configured,
        baseUrl: config.baseUrl,
        tenantId: config.tenantId,
        hasApiKey: Boolean(config.apiKey),
        apiKeyPrefix: config.apiKey ? config.apiKey.slice(0, 10) + "..." : "NONE",
      },
      catalogTest,
      testError,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
