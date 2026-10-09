import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StoreSettings from "@/lib/models/StoreSettings";

export async function GET() {
  try {
    await dbConnect();
    let settings = await StoreSettings.findOne({ key: "general" }).lean();
    if (!settings) {
      settings = {
        bankName: "Zenith Bank",
        accountNumber: "1012345678",
        accountName: "AMStores Limited",
        paymentInstructions: "Please transfer the exact amount and use your full name or Order Code as payment reference.",
        storePhone: "08023434790",
        storeEmail: "amstores@gmail.com",
        storeAddress: "Ayegoro Junction, Kolapo Ishola Estate, Akobo, Ibadan",
      };
    }

    return NextResponse.json({
      success: true,
      bankName: settings.bankName || "Zenith Bank",
      accountNumber: settings.accountNumber || "1012345678",
      accountName: settings.accountName || "AMStores Limited",
      paymentInstructions: settings.paymentInstructions || "Please transfer the exact amount and use your full name or Order Code as payment reference.",
      storePhone: settings.storePhone || "08023434790",
      storeEmail: settings.storeEmail || "amstores@gmail.com",
      storeAddress: settings.storeAddress || "Ayegoro Junction, Kolapo Ishola Estate, Akobo, Ibadan",
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      bankName: "Zenith Bank",
      accountNumber: "1012345678",
      accountName: "AMStores Limited",
      paymentInstructions: "Please transfer the exact amount and use your full name or Order Code as payment reference.",
      storePhone: "08023434790",
      storeEmail: "amstores@gmail.com",
      storeAddress: "Ayegoro Junction, Kolapo Ishola Estate, Akobo, Ibadan",
    });
  }
}
