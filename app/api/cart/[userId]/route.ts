import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Cart from "@/lib/models/Cart";
import Product from "@/lib/models/Product";
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
        return {
          productId: prodId,
          _id: prodId,
          id: prodId,
          qty: Number(item.qty) || 1,
          name: item.name || product?.name || "Product",
          price: Number(item.price ?? product?.price) || 0,
          image: item.image || product?.image || "",
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
