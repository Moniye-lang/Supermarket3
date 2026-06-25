"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface LocationData {
  lat: number;
  lng: number;
  ts: number;
  [key: string]: any;
}

export default function useOrderTracking(orderId: string | null, token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [path, setPath] = useState<LocationData[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://supermarket3.onrender.com";
    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("viewer:join", { orderId });
    });

    socket.on("order:location", (data: LocationData) => {
      setLocation(data);
      setPath((p) => [...p, { lat: data.lat, lng: data.lng, ts: data.ts }]);
    });

    socket.on("order:status", (d: { status: string }) => setStatus(d.status));

    // fetch initial path from API
    fetch(`${API_URL}/api/tracking/${orderId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(r => r.json()).then(d => {
      if (d?.path) setPath(d.path);
      if (d?.latest) setLocation(d.latest);
    }).catch(() => { });

    return () => { socket.disconnect(); };
  }, [orderId, token]);

  return { socket: socketRef.current, location, path, status };
}
