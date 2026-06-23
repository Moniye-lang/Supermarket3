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

    // Auto-refresh product data from DB
    const syncedItems = await Promise.all(
      cart.items.map(async (item: any) => {
        const product = await Product.findById(item.productId).lean() as any;
        return {
          productId: item.productId,
          qty: item.qty,
          name: product?.name || item.name || "Unknown Product",
          price: product?.price || item.price || 0,
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
