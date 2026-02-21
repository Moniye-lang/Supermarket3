// useOrderTracking.js
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function useOrderTracking(orderId, token) {
  const socketRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [path, setPath] = useState([]);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("viewer:join", { orderId });
    });

    socket.on("order:location", (data) => {
      setLocation(data);
      setPath((p) => [...p, { lat: data.lat, lng: data.lng, ts: data.ts }]);
    });

    socket.on("order:status", (d) => setStatus(d.status));

    // fetch initial path from API
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tracking/${orderId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(r => r.json()).then(d => {
      if (d?.path) setPath(d.path);
      if (d?.latest) setLocation(d.latest);
    }).catch(() => { });

    return () => { socket.disconnect(); };
  }, [orderId, token]);

  return { socket: socketRef.current, location, path, status };
}
