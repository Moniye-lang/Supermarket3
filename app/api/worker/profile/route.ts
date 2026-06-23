import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { verifyWorker } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Verify worker access
    const authUser = await verifyWorker(req);
    if (!authUser) {
      return NextResponse.json({ error: "Worker access required!" }, { status: 403 });
    }

    const worker = await User.findById(authUser.id).select("-passwordHash");
    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json(worker);
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
