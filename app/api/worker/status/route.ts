import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { verifyWorker } from "@/lib/authMiddleware";

export async function PATCH(req: Request) {
  try {
    await dbConnect();

    // Verify worker access
    const authUser = await verifyWorker(req);
    if (!authUser) {
      return NextResponse.json({ error: "Worker access required!" }, { status: 403 });
    }

    const { status } = await req.json();
    if (!["available", "busy", "offline", "break"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const worker = await User.findByIdAndUpdate(
      authUser.id,
      { status, isAvailable: status === "available" },
      { new: true }
    ).select("-passwordHash");

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // Broadcast status change to connected clients (like Admin dashboard)
    const io = (global as any).io;
    if (io) {
      io.emit("workerStatusChanged", { workerId: worker._id, status: worker.status });
    }

    return NextResponse.json({ success: true, worker });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
