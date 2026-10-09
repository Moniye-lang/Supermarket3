import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StoreSettings from "@/lib/models/StoreSettings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await dbConnect();
    let settings = await StoreSettings.findOne({ key: "general" }).lean();
    if (!settings) {
      settings = {
        bankName: "Opay",
        accountNumber: "6428191020",
        accountName: "Agbeni Mercantile Stores ltd supermarket",
        paymentInstructions: "Please transfer the exact amount and use your full name or Order Code as payment reference.",
        storePhone: "08023434790",
        storeEmail: "amstores@gmail.com",
        storeAddress: "Ayegoro Junction, Kolapo Ishola Estate, Akobo, Ibadan",
      };
    }

    return NextResponse.json(
      {
        success: true,
        bankName: settings.bankName || "Opay",
        accountNumber: settings.accountNumber || "6428191020",
        accountName: settings.accountName || "Agbeni Mercantile Stores ltd supermarket",
        paymentInstructions: settings.paymentInstructions || "Please transfer the exact amount and use your full name or Order Code as payment reference.",
        storePhone: settings.storePhone || "08023434790",
        storeEmail: settings.storeEmail || "amstores@gmail.com",
        storeAddress: settings.storeAddress || "Ayegoro Junction, Kolapo Ishola Estate, Akobo, Ibadan",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: true,
        bankName: "Opay",
        accountNumber: "6428191020",
        accountName: "Agbeni Mercantile Stores ltd supermarket",
        paymentInstructions: "Please transfer the exact amount and use your full name or Order Code as payment reference.",
        storePhone: "08023434790",
        storeEmail: "amstores@gmail.com",
        storeAddress: "Ayegoro Junction, Kolapo Ishola Estate, Akobo, Ibadan",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}
