import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Cart from "@/lib/models/Cart";
import Product from "@/lib/models/Product";
import { verifyAuth } from "@/lib/authMiddleware";
import { DEFAULT_PRODUCTS } from "@/lib/defaultProducts";

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

    // Ensure each item has authoritative product info safely
    const enrichedItems = await Promise.all(
      items.map(async (item: any) => {
        const prodId = String(item.productId || item._id || item.id || "");
        if (!prodId) return null;

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

        const authoritativePrice = product ? Number(product.price) : 0;
        return {
          productId: prodId,
          name: product?.name || item.name || "Product",
          price: authoritativePrice,
          image: product?.image || item.image || "",
          qty: Math.max(1, Math.floor(Number(item.qty) || 1)),
        };
      })
    );

    const validItems = enrichedItems.filter(Boolean);

    let cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = validItems;
      cart.updatedAt = new Date();
      await cart.save();
    } else {
      cart = await Cart.create({ userId, items: validItems });
    }

    return NextResponse.json({ msg: "Cart saved successfully", cart });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
