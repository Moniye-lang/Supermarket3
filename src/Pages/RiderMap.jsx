// src/pages/RiderMap.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";

// Connect socket
const socket = io("http://localhost:5000", { transports: ["websocket"] });

// custom rider icon
const riderIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

export default function RiderMap() {
  const { state } = useLocation();
  const fallbackDest = { lat: 6.5244,lng: 3.3792 }
  const destination = state?.destination;
  const orderId = localStorage.getItem("orderId");

  const [route, setRoute] = useState([]);
  const [riderPos, setRiderPos] = useState(null);
  const [eta, setEta] = useState(null);
  const [progress, setProgress] = useState(0);

  const STORE_LOCATION = { lat: 7.4332, lng: 3.9471 };

  // Step 1 — Fetch route from backend simulation
  useEffect(() => {
    if (!destination) {
      console.error("No destination passed to RiderMap");
      return;
    }

    const startSimulation = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/rider/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destination }),
        });
        const data = await res.json();

        if (res.ok && data.path?.length) {
          setRoute(data.path);
        } else {
          console.error("Simulation failed", data);
        }
      } catch (err) {
        console.error("Failed to start simulation:", err);
      }
    };

    startSimulation();
  }, [destination]);

  // Step 2 — Move rider along route every second
  useEffect(() => {
    if (route.length > 0) {
      let i = 0;
      const interval = setInterval(() => {
        setRiderPos(route[i]);
        setEta(route[i].eta);
        setProgress(((i + 1) / route.length) * 100);
        i++;
        if (i >= route.length) clearInterval(interval);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [route]);

  // Step 3 — Listen for backend real-time location updates (optional)
  useEffect(() => {
    socket.on("riderLocation", (data) => setRiderPos(data));
    return () => socket.off("riderLocation");
  }, []);

  // Step 4 — Handle map load and fallback
  if (!destination)
    return (
      <div className="h-screen flex items-center justify-center text-gray-600 text-lg">
        ❌ No destination passed
      </div>
    );

  if (!route.length)
    return (
      <div className="h-screen flex items-center justify-center text-gray-600 text-lg">
        Preparing route simulation...
      </div>
    );

  return (
    <div className="h-screen w-full relative">
      <MapContainer
        center={[STORE_LOCATION.lat, STORE_LOCATION.lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {/* Route Path */}
        <Polyline
          positions={route.map((p) => [p.lat, p.lng])}
          color="blue"
          weight={4}
        />

        {/* Store Marker */}
        <Marker position={[STORE_LOCATION.lat, STORE_LOCATION.lng]}>
          <Popup>🏬 Agbeni Mercantile Stores</Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={[destination.lat, destination.lng]}>
          <Popup>📍 Customer Destination</Popup>
        </Marker>

        {/* Rider Marker */}
        {riderPos && (
          <Marker
            position={[riderPos.lat, riderPos.lng]}
            icon={riderIcon}
          >
            <Popup>
              🚴‍♂ Rider on route <br />
              ETA: {eta}s
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Progress Display */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 text-gray-800 px-6 py-3 rounded-lg shadow-md text-sm font-semibold">
        {riderPos
          ? `Rider en route... ${progress.toFixed(0)}% complete | ETA: ${eta}s`
          : "Starting delivery..."}
      </div>
    </div>
  );
}