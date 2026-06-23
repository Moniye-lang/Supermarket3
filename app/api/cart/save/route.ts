import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Cart from "@/lib/models/Cart";
import Product from "@/lib/models/Product";
import { verifyAuth } from "@/lib/authMiddleware";

export async function POST(req: Request) {
  try {
    await dbConnect();

    // Verify authenticated user
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: "You are not authenticated!" }, { status: 401 });
    }

    const userId = authUser.id;
    const { items } = await req.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items format" }, { status: 400 });
    }

    // Ensure each item has full product info
    const enrichedItems = await Promise.all(
      items.map(async (item: any) => {
        const product = await Product.findById(item.productId).lean() as any;
        return {
          productId: item.productId,
          name: product?.name || item.name || "Unknown Product",
          price: product?.price || item.price || 0,
          image: product?.image || item.image || "",
          qty: item.qty || 1,
        };
      })
    );

    let cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = enrichedItems;
      cart.updatedAt = new Date();
      await cart.save();
    } else {
      cart = await Cart.create({ userId, items: enrichedItems });
    }

    return NextResponse.json({ msg: "Cart saved successfully", cart });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
