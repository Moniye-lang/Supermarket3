// routes/rider.js
import express from "express";

const router = express.Router();
let io; // we’ll set this from server.js

export function setIO(socketIO) {
  io = socketIO;
}

// static store coordinates
const STORE_LOCATION = {
  name: "Agbeni Mercantile Stores",
  lat: 7.4332,
  lng: 3.9471,
};

// simulate route
router.post("/simulate", async (req, res) => {
  try {
    const { destination } = req.body;
    if (!destination) return res.status(400).json({ error: "No destination provided" });

    const steps = 20;
    const path = [];
    const latStep = (destination.lat - STORE_LOCATION.lat) / steps;
    const lngStep = (destination.lng - STORE_LOCATION.lng) / steps;

    for (let i = 0; i <= steps; i++) {
      path.push({
        lat: STORE_LOCATION.lat + latStep * i,
        lng: STORE_LOCATION.lng + lngStep * i,
        eta: Math.max(0, (steps - i) * 2),
      });
    }

    // send initial data
    res.json({ store: STORE_LOCATION, destination, path });

    // simulate live movement
    let index = 0;
    const interval = setInterval(() => {
      if (index < path.length) {
        io.emit("riderLocation", path[index]); // broadcast each point
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1000);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;