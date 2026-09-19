import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StoreSettings from "@/lib/models/StoreSettings";
import { verifyAdmin } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    let settings = await StoreSettings.findOne({ key: "general" });
    if (!settings) {
      settings = await StoreSettings.create({ key: "general" });
    }

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { bankName, accountNumber, accountName, paymentInstructions, storePhone, storeEmail, storeAddress } = body;

    let settings = await StoreSettings.findOneAndUpdate(
      { key: "general" },
      {
        $set: {
          ...(bankName !== undefined && { bankName }),
          ...(accountNumber !== undefined && { accountNumber }),
          ...(accountName !== undefined && { accountName }),
          ...(paymentInstructions !== undefined && { paymentInstructions }),
          ...(storePhone !== undefined && { storePhone }),
          ...(storeEmail !== undefined && { storeEmail }),
          ...(storeAddress !== undefined && { storeAddress }),
        }
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, message: "Settings updated successfully", settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
