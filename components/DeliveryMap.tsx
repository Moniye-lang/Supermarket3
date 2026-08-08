"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Navigation, MapPin, Loader2 } from "lucide-react";

import {
  STORE_LAT, STORE_LNG, haversineKm, calcDeliveryFee
} from "@/lib/storeHours";

export { STORE_LAT, STORE_LNG, haversineKm, calcDeliveryFee };

// Helper to safely create DivIcon on the client
function createCustomIcon(bgColor: string, emoji: string) {
  if (typeof window === "undefined" || !L) return undefined as any;
  return new L.DivIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;background:${bgColor};border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);font-size:14px;">${emoji}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

// ─── Inner map subcomponents ───────────────────────────────────────────────────
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface DeliveryMapProps {
  latitude: number;
  longitude: number;
  deliveryFee: number;
  distanceKm: number;
  onChange: (lat: number, lng: number, address: string, fee: number, distKm: number) => void;
}

export default function DeliveryMap({
  latitude, longitude, deliveryFee, distanceKm, onChange,
}: DeliveryMapProps) {
  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storeIcon = React.useMemo(() => createCustomIcon("#b91c1c", "🏪"), []);
  const customerIcon = React.useMemo(() => createCustomIcon("#7c3aed", "📍"), []);

  const updatePosition = useCallback(async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setGeocoding(true);
    const km = haversineKm(STORE_LAT, STORE_LNG, lat, lng);
    const fee = calcDeliveryFee(km);
    try {
      const res = await fetch(`/api/map/reverse?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      onChange(lat, lng, addr, fee, km);
    } catch {
      onChange(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`, fee, km);
    } finally {
      setGeocoding(false);
    }
  }, [onChange]);

  // Nominatim autocomplete
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + " Ibadan Nigeria")}&format=json&limit=5`
        );
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 450);
  }, []);

  function pickSuggestion(s: any) {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setSearchQuery(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    updatePosition(lat, lng);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => updatePosition(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true }
    );
  }

  const routeLine: [number, number][] = [
    [STORE_LAT, STORE_LNG],
    [position[0], position[1]],
  ];

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-white border-2 border-gray-200 focus-within:border-brand-primary rounded-2xl px-4 py-3 shadow-sm transition-colors">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search your delivery address..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
          />
          {searching && <Loader2 size={16} className="text-brand-primary animate-spin shrink-0" />}
          <button
            type="button"
            onClick={useMyLocation}
            className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-dark transition-colors shrink-0"
            title="Use my current location"
          >
            <Navigation size={15} /> Use me
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickSuggestion(s)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <MapPin size={14} className="text-brand-primary mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700 line-clamp-2">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 300 }}>
        <MapContainer
          center={[STORE_LAT, STORE_LNG]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="© OpenStreetMap contributors © CartoDB"
          />

          {/* Dashed route line */}
          <Polyline
            positions={routeLine}
            pathOptions={{
              color: "#7c3aed",
              weight: 3,
              opacity: 0.7,
              dashArray: "8 6",
            }}
          />

          {/* Store pin */}
          <Marker position={[STORE_LAT, STORE_LNG]} icon={storeIcon} />

          {/* Customer pin */}
          <Marker position={position} icon={customerIcon} />

          <RecenterMap lat={position[0]} lng={position[1]} />
          <MapClickHandler onMapClick={updatePosition} />
        </MapContainer>

        {/* Map legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur rounded-xl shadow px-3 py-2 flex flex-col gap-1.5 text-xs font-medium text-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-700 rounded-full" />
            <span>Store</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-violet-600 rounded-full" />
            <span>Your location</span>
          </div>
        </div>

        {/* Geocoding overlay */}
        {geocoding && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-2xl">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-lg text-sm font-semibold text-gray-700">
              <Loader2 size={16} className="animate-spin text-brand-primary" />
              Finding address...
            </div>
          </div>
        )}
      </div>

      {/* Distance + fee callout */}
      <div className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-brand-primary/5 border border-violet-200/60 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="text-lg">🛵</span>
          <span>
            <span className="font-semibold text-gray-900">{distanceKm.toFixed(1)} km</span> from store
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 block">Delivery fee</span>
          <span className="text-base font-bold text-violet-700">
            ₦{deliveryFee.toLocaleString()}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <MapPin size={11} />
        Tap anywhere on the map to move your pin, or drag to refine
      </p>
    </div>
  );
}
