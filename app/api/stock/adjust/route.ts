import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/authMiddleware";
import { isStoreApiConfigured, adjustStock } from "@/lib/storeApi";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";

export async function POST(req: Request) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser || !["admin", "worker"].includes(authUser.role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, adjustBy, remarks, storeId, adjustmentTypeId, cost } = body;

    if (!productId || adjustBy === undefined || Number(adjustBy) === 0) {
      return NextResponse.json(
        { error: "productId and non-zero adjustBy quantity are required" },
        { status: 400 }
      );
    }

    const prodIdNum = parseInt(String(productId).replace(/\D/g, "") || "1", 10);
    const adjustQty = Number(adjustBy);

    let storeAppResult = null;
    if (isStoreApiConfigured()) {
      try {
        const res = await adjustStock({
          productId: prodIdNum,
          storeId: Number(storeId) || 1,
          adjustBy: adjustQty,
          adjustmentTypeId: Number(adjustmentTypeId) || 1,
          cost: Number(cost) || 0,
          remarks: remarks || `Stock adjustment by ${authUser.role}`,
        });
        storeAppResult = res;
      } catch (storeErr: any) {
        console.warn("[Stock Adjust] StoreApp API error:", storeErr.message);
      }
    }

    // Also update local MongoDB product stock if present
    try {
      await dbConnect();
      await Product.findOneAndUpdate(
        { $or: [{ storeProductId: String(productId) }, { id: prodIdNum }] },
        { $inc: { stock: adjustQty } }
      );
    } catch (dbErr: any) {
      console.warn("[Stock Adjust] MongoDB stock increment error:", dbErr.message);
    }

    return NextResponse.json({
      success: true,
      productId: prodIdNum,
      adjustBy: adjustQty,
      storeAppResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
