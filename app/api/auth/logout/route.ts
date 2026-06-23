import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/authMiddleware";
import { addToBlacklist } from "@/lib/tokenBlacklist";

export async function POST(req: Request) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: "You are not authenticated!" }, { status: 401 });
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("token");
    if (!authHeader) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    const token = authHeader.split(" ")[1];
    await addToBlacklist(token);

    return NextResponse.json({ success: true, message: "Logged out successfully. Token invalidated." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
