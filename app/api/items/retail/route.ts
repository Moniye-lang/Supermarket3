import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const size = Number(searchParams.get("size")) || 10;
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    const query: any = {};
    if (category && category !== "All Departments") {
      // Direct exact case-insensitive match for category filter
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }
    if (q) {
      query.name = { $regex: q, $options: "i" };
    }

    const skip = (page - 1) * size;

    const products = await Product.find(query)
      .skip(skip)
      .limit(size);

    const total = await Product.countDocuments(query);

    const formattedItems = products.map((p: any) => ({
      productId: p._id.toString(),
      _id: p._id.toString(),
      name: p.name,
      description: p.description || "",
      category: p.category || "Uncategorized",
      brand: "AMstores",
      price: p.price,
      stock: p.stock || 0,
      imageUrl: p.image || "",
      image: p.image || "",
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    return NextResponse.json({
      total,
      page,
      pageSize: size,
      items: formattedItems
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
