import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "general",
      unique: true,
      required: true,
    },
    bankName: {
      type: String,
      default: "Zenith Bank",
    },
    accountNumber: {
      type: String,
      default: "1012345678",
    },
    accountName: {
      type: String,
      default: "AMStores Limited",
    },
    paymentInstructions: {
      type: String,
      default: "Please transfer the exact amount and use your full name or Order Code as payment reference.",
    },
    storePhone: {
      type: String,
      default: "08023434790",
    },
    storeEmail: {
      type: String,
      default: "amstores@gmail.com",
    },
    storeAddress: {
      type: String,
      default: "Ayegoro Junction, Kolapo Ishola Estate, Akobo, Ibadan",
    },
  },
  { timestamps: true }
);

export default mongoose.models.StoreSettings || mongoose.model("StoreSettings", storeSettingsSchema);
