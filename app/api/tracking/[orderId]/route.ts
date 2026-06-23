import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tracking from "@/lib/models/Tracking";
import { verifyAuth } from "@/lib/authMiddleware";

export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await dbConnect();

    // Verify authenticated user
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: "You are not authenticated!" }, { status: 401 });
    }

    const { orderId } = await params;

    // Admins can see any order
    if (authUser.role === "admin") {
      const trackAdmin = await Tracking.findOne({ orderId }).lean();
      return NextResponse.json(trackAdmin || { path: [], latest: null });
    }

    // Regular user: verify they own the order
    const track: any = await Tracking.findOne({ orderId }).lean();
    if (!track) {
      return NextResponse.json({ path: [], latest: null });
    }

    if (track.customerId && track.customerId.toString() !== authUser.id) {
      return NextResponse.json({ error: "You are not allowed to view this tracking info" }, { status: 403 });
    }

    return NextResponse.json(track);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
