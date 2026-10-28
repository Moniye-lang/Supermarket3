import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { verifyAuth } from "@/lib/authMiddleware";
import { isStoreApiConfigured, adjustStock } from "@/lib/storeApi";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import pusher from "@/lib/pusher";

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
    let updatedProduct = null;
    try {
      await dbConnect();
      const orConditions: any[] = [
        { storeProductId: String(productId) },
        { sku: String(productId) },
      ];
      if (mongoose.Types.ObjectId.isValid(String(productId))) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(String(productId)) });
      }
      if (!isNaN(prodIdNum) && prodIdNum > 0) {
        orConditions.push({ id: prodIdNum });
      }

      updatedProduct = await Product.findOneAndUpdate(
        { $or: orConditions },
        { $inc: { stock: adjustQty } },
        { new: true }
      );

      // Trigger Pusher real-time event for admin and inventory sync
      try {
        await pusher.trigger("admin-orders", "stockUpdated", {
          productId: String(productId),
          adjustBy: adjustQty,
          newStock: updatedProduct?.stock ?? null,
        });
      } catch (pushErr: any) {
        console.warn("[Stock Adjust] Pusher stockUpdated trigger error:", pushErr.message);
      }
    } catch (dbErr: any) {
      console.warn("[Stock Adjust] MongoDB stock increment error:", dbErr.message);
    }

    return NextResponse.json({
      success: true,
      productId,
      adjustBy: adjustQty,
      newStock: updatedProduct?.stock ?? null,
      storeAppResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
