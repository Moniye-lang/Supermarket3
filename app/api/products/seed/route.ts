import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { DEFAULT_PRODUCTS } from "@/lib/defaultProducts";

export async function GET() {
  try {
    await dbConnect();
    // Drop existing products
    await Product.deleteMany({});
    // Seed new products
    const products = await Product.insertMany(DEFAULT_PRODUCTS);
    return NextResponse.json({ success: true, count: products.length, products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
