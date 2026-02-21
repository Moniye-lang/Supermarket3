// models/Tracking.js
import mongoose from "mongoose";

const locSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  speed: Number,
  bearing: Number,
  accuracy: Number,
  ts: { type: Date, default: Date.now }
});

const trackingSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  path: { type: [locSchema], default: [] },
  latest: locSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Tracking || mongoose.model("Tracking", trackingSchema);
