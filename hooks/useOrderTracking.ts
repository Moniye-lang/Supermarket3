"use client";

import { useEffect, useRef, useState } from "react";
import pusherClient from "@/lib/pusher-client";
import type { Channel } from "pusher-js";

interface LocationData {
  lat: number;
  lng: number;
  ts: number;
  [key: string]: any;
}

export default function useOrderTracking(orderId: string | null, token: string | null) {
  const channelRef = useRef<Channel | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [path, setPath] = useState<LocationData[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    // Subscribe to Pusher channel
    const channel = pusherClient.subscribe(`order-${orderId}`);
    channelRef.current = channel;

    channel.bind("order:location", (data: LocationData) => {
      setLocation(data);
      setPath((p) => [...p, { lat: data.lat, lng: data.lng, ts: data.ts }]);
    });

    channel.bind("order:status", (d: { status: string }) => setStatus(d.status));

    // Fetch initial path from API
    fetch(`/api/tracking/${orderId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(r => r.json()).then(d => {
      if (d?.path) setPath(d.path);
      if (d?.latest) setLocation(d.latest);
    }).catch(() => { });

    return () => {
      pusherClient.unsubscribe(`order-${orderId}`);
    };
  }, [orderId, token]);

  return { location, path, status };
}

