import { NextResponse } from "next/server";

// Static store coordinates
const STORE_LOCATION = {
  name: "Agbeni Mercantile Stores",
  lat: 7.4332,
  lng: 3.9471,
};

export async function POST(req: Request) {
  try {
    const { destination } = await req.json();
    if (!destination) {
      return NextResponse.json({ error: "No destination provided" }, { status: 400 });
    }

    const steps = 20;
    const path: any[] = [];
    const latStep = (destination.lat - STORE_LOCATION.lat) / steps;
    const lngStep = (destination.lng - STORE_LOCATION.lng) / steps;

    for (let i = 0; i <= steps; i++) {
      path.push({
        lat: STORE_LOCATION.lat + latStep * i,
        lng: STORE_LOCATION.lng + lngStep * i,
        eta: Math.max(0, (steps - i) * 2),
      });
    }

    // Send initial response
    const res = NextResponse.json({ store: STORE_LOCATION, destination, path });

    // Simulate live movement using Socket.io broadcast
    const io = (global as any).io;
    if (io) {
      let index = 0;
      const interval = setInterval(() => {
        if (index < path.length) {
          io.emit("riderLocation", path[index]); // broadcast each point
          index++;
        } else {
          clearInterval(interval);
        }
      }, 1000);
    }

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
