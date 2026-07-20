"use client";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default leaflet marker icon
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface CheckoutMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number, address: string) => void;
}

export default function CheckoutMap({ latitude, longitude, onChange }: CheckoutMapProps) {
  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);
  const [loading, setLoading] = useState(false);

  // Update center when props change
  useEffect(() => {
    setPosition([latitude, longitude]);
  }, [latitude, longitude]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/map/reverse?lat=${lat}&lng=${lng}`
      );
      if (response.ok) {
        const data = await response.json();
        const displayName = data.display_name || `Pinpointed Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        onChange(lat, lng, displayName);
      } else {
        onChange(lat, lng, `Pinpointed Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch (error) {
      onChange(lat, lng, `Pinpointed Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } finally {
      setLoading(false);
    }
  };

  // Map events to handle click
  function MapEvents() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
      },
    });
    return null;
  }

  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const observer = new MutationObserver(() => {
      const isCurrentlyDark = document.documentElement.classList.contains("dark");
      setTheme(isCurrentlyDark ? "dark" : "light");
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
        <span>📍 Tap on the map to pinpoint your exact delivery address</span>
        {loading && <span className="text-brand-primary animate-pulse">Fetching address...</span>}
      </div>
      <div className="h-[250px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            key={theme}
            url={`/api/map/tiles/{z}/{x}/{y}?theme=${theme}`}
            attribution="© CartoDB contributors"
          />
          <Marker position={position} icon={customIcon} />
          <MapEvents />
        </MapContainer>
      </div>
    </div>
  );
}
