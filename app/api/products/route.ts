import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { verifyAdmin } from "@/lib/authMiddleware";

// GET all products (pagination & search)
export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    let limit = Number(searchParams.get("limit")) || 20;
    if (limit > 1000) limit = 1000; // enforce maximum ceiling limit of 1000
    const skip = (page - 1) * limit;

    const query: any = {};
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    if (category) query.category = category;
    if (q) query.name = { $regex: q, $options: "i" };

    const products = await Product.find(query)
      .select("name price description image category stock")
      .skip(skip)
      .limit(limit);
    const total = await Product.countDocuments(query);

    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Admin POST: Add product
export async function POST(req: Request) {
  try {
    await dbConnect();

    // Verify Admin
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required!" }, { status: 403 });
    }

    const { name, price, stock = 0, category = "Uncategorized", image = "", description = "" } = await req.json();
    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required." }, { status: 400 });
    }

    const p = new Product({ name, price, stock, category, image, description });
    await p.save();
    return NextResponse.json(p, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
