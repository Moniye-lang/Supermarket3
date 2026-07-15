import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as IOServer } from "socket.io";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import dns from "dns";
import User from "./lib/models/User";
import Order from "./lib/models/Order";
import Tracking from "./lib/models/Tracking";
import { cleanupOldGuestOrders } from "./lib/utils/cleanup";

// dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config({ path: ".env.local", override: true });

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "";
mongoose.connect(MONGO_URI, {
  maxPoolSize: 30,
}).then(() => {
  console.log("🔌 MongoDB connected in custom server");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new IOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
  });

  (global as any).io = io;

  // SOCKET AUTH
  io.use(async (socket, nextFn) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return nextFn(); // allow unauthenticated viewer
      const JWT_SECRET = process.env.JWT_SECRET!;
      if (!JWT_SECRET) return nextFn(new Error("JWT_SECRET environment variable is missing"));
      const payload = jwt.verify(token, JWT_SECRET) as any;
      const user = await User.findById(payload.id);
      if (!user) return nextFn(new Error("Auth error"));
      (socket as any).user = user;
      nextFn();
    } catch {
      nextFn();
    }
  });

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
      } catch (err: any) {
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
      } catch (err: any) {
        console.error("rider:status err:", err.message);
      }
    });

    // --- JOIN ORDER ROOM (for customer) ---
    socket.on("joinOrderRoom", (orderId) => {
      socket.join(orderId);
      console.log(`Client joined order room: ${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  // Run cleanup on startup and set interval for 24h
  cleanupOldGuestOrders();
  setInterval(() => cleanupOldGuestOrders(), 24 * 60 * 60 * 1000);

  // --- SIMULATED RIDER MOVEMENT ---
  let simulatedLat = 7.4332; // Agbeni Mercantile Stores (Ibadan)
  let simulatedLng = 3.9471;
  const moveStep = 0.0005;

  setInterval(() => {
    simulatedLat += (Math.random() - 0.5) * moveStep;
    simulatedLng += (Math.random() - 0.5) * moveStep;

    io.emit("riderLocation", {
      lat: simulatedLat,
      lng: simulatedLng,
    });
  }, 2000);

  httpServer.listen(port, () => {
    console.log(`🚀 Custom Server running on port ${port}`);
  });
});
