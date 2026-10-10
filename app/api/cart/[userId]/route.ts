import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Cart from "@/lib/models/Cart";
import Product from "@/lib/models/Product";
import { DEFAULT_PRODUCTS } from "@/lib/defaultProducts";
import { verifyAuthorization } from "@/lib/authMiddleware";

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await dbConnect();
    const { userId } = await params;

    // Verify authorized user (owner or admin)
    const authUser = await verifyAuthorization(req, userId);
    if (!authUser) {
      return NextResponse.json({ error: "You are not allowed to do that!" }, { status: 403 });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Auto-refresh product data from DB safely
    const syncedItems = await Promise.all(
      cart.items.map(async (item: any) => {
        const prodId = String(item.productId || "");
        let product: any = null;
        if (prodId.match(/^[0-9a-fA-F]{24}$/)) {
          try {
            product = await Product.findById(prodId).lean();
          } catch {}
        }
        if (!product) {
          product = await Product.findOne({ $or: [{ storeProductId: prodId }, { sku: prodId }] }).lean();
        }
        if (!product) {
          product = DEFAULT_PRODUCTS.find((dp) => dp.id === prodId);
        }
        return {
          productId: prodId,
          _id: prodId,
          id: prodId,
          qty: Math.max(1, Math.floor(Number(item.qty) || 1)),
          name: product?.name || item.name || "Product",
          price: product ? Number(product.price) : (Number(item.price) || 0),
          image: product?.image || item.image || "",
        };
      })
    );

    cart.items = syncedItems;
    await cart.save();

    return NextResponse.json({ items: syncedItems });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
