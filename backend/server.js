// server.js
import { Server as IOServer } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import productsRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import ordersRoutes from "./routes/orders.js";
import trackingRoutes from "./routes/tracking.js";
import Product from "./models/Product.js";
import Tracking from "./models/Tracking.js";
import Order from "./models/Order.js";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import http from "http";
import express from "express";
import riderRoutes from "./routes/rider.js";
import { setIO } from "./routes/rider.js";
import { cleanupOldGuestOrders } from "./utils/cleanup.js";
import workerRoute from "./routes/worker.js";
import workerAuthRoutes from "./routes/workerAuth.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
cleanupOldGuestOrders();

// attach io to app
app.set("io", io);

// connect Mongo
await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/amstores");
console.log("✅ MongoDB connected");

// mount routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/worker", workerRoute); 
app.use("/api/worker", workerAuthRoutes);
setIO(io);
setInterval(() => cleanupOldGuestOrders(), 24 * 60 * 60 * 1000);

// health check
app.get("/", (req, res) => res.send("AMStores backend up ✅"));

// SOCKET AUTH
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // allow unauthenticated viewer
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return next(new Error("Auth error"));
    socket.user = user;
    next();
  } catch {
    next();
  }
});

// SINGLE io.on("connection") only (you had two before)
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // --- VIEWER JOINS ORDER ROOM ---
  socket.on("viewer:join", ({ orderId }) => {
    socket.join(orderId);
    console.log(`Viewer joined order room: ${orderId}`);
  });

  // --- RIDER JOINS ORDER ROOM ---
  socket.on("rider:join", ({ orderId }) => {
    socket.join(orderId);
    console.log(`Rider joined order room: ${orderId}`);
  });

  // --- RIDER LOCATION ---
  socket.on("rider:location", async (payload) => {
    try {
      const { orderId, riderId, lat, lng, speed, bearing, accuracy, ts } = payload;
      if (!orderId || lat == null || lng == null) return;

      io.to(orderId).emit("order:location", {
        riderId,
        lat,
        lng,
        speed,
        bearing,
        accuracy,
        ts: ts || Date.now(),
      });

      const time = ts ? new Date(ts) : new Date();
      const update = {
        $set: {
          latest: { lat, lng, speed, bearing, accuracy, ts: time },
          updatedAt: new Date(),
        },
        $push: {
          path: {
            $each: [{ lat, lng, speed, bearing, accuracy, ts: time }],
            $slice: -500,
          },
        },
      };
      await Tracking.findOneAndUpdate({ orderId, riderId }, update, {
        upsert: true,
        new: true,
      });
    } catch (err) {
      console.error("rider:location error:", err.message);
    }
  });

  // --- RIDER STATUS (delivered, cancelled, etc.) ---
  socket.on("rider:status", async ({ orderId, riderId, status }) => {
    try {
      if (orderId && status) {
        await Order.findByIdAndUpdate(orderId, { status });
        io.to(orderId).emit("order:status", {
          riderId,
          status,
          ts: Date.now(),
        });
      }
    } catch (err) {
      console.error("rider:status err:", err.message);
    }
  });

  // --- JOIN ORDER ROOM (for customer) ---
  socket.on("joinOrderRoom", (orderId) => {
    socket.join(orderId);
    console.log(`Client joined order room: ${orderId}`);
  });

  socket.on("disconnect", () =>
    console.log("🔴 Socket disconnected:", socket.id)
  );
});

// --- SIMULATED RIDER MOVEMENT ---
let simulatedLat = 7.4332; // Agbeni Mercantile Stores (Ibadan)
let simulatedLng = 3.9471;
let moveStep = 0.0005;

// This interval sends location updates every 2s to everyone connected
setInterval(() => {
  simulatedLat += (Math.random() - 0.5) * moveStep;
  simulatedLng += (Math.random() - 0.5) * moveStep;

  io.emit("riderLocation", {
    lat: simulatedLat,
    lng: simulatedLng,
  });
}, 2000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
