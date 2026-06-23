import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Order from "@/lib/models/Order";
import { verifyAdmin } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Verify Admin access
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required!" }, { status: 403 });
    }

    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    
    // Attach order count for each user
    const usersWithStats = await Promise.all(users.map(async (u: any) => {
      const orderCount = await Order.countDocuments({ customerId: u._id });
      return { ...u.toObject(), totalOrders: orderCount };
    }));

    return NextResponse.json(usersWithStats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
