"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Navigation, MapPin, Loader2, X, Compass } from "lucide-react";

import {
  STORE_LAT,
  STORE_LNG,
  haversineKm,
  calcDeliveryFee,
} from "@/lib/storeHours";

export { STORE_LAT, STORE_LNG, haversineKm, calcDeliveryFee };

// Helper to safely create DivIcon on the client
function createCustomIcon(bgColor: string, emoji: string, isDraggable = false) {
  if (typeof window === "undefined" || !L) return undefined as any;
  return new L.DivIcon({
    className: "custom-map-pin",
    html: `
      <div style="
        position: relative;
        width: 42px;
        height: 42px;
        background: ${bgColor};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: ${isDraggable ? "grab" : "default"};
        transition: transform 0.15s ease;
      ">
        <span style="transform: rotate(45deg); font-size: 16px; user-select: none;">${emoji}</span>
      </div>
      ${
        isDraggable
          ? `<div style="
              width: 14px;
              height: 5px;
              background: rgba(0,0,0,0.25);
              border-radius: 50%;
              margin: 2px auto 0 auto;
              filter: blur(1px);
            "></div>`
          : ""
      }
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
  });
}

// ─── Inner map controller subcomponents ─────────────────────────────────────────
function MapController({
  lat,
  lng,
  onMapClick,
}: {
  lat: number;
  lng: number;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), {
      animate: true,
      duration: 1.2,
    });
  }, [lat, lng, map]);

  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

// ─── Props ──────────────────────────────────────────────────────────────────────
interface DeliveryMapProps {
  latitude: number;
  longitude: number;
  deliveryFee: number;
  distanceKm: number;
  initialAddress?: string;
  onChange: (
    lat: number,
    lng: number,
    address: string,
    fee: number,
    distKm: number
  ) => void;
}

export default function DeliveryMap({
  latitude,
  longitude,
  deliveryFee,
  distanceKm,
  initialAddress = "",
  onChange,
}: DeliveryMapProps) {
  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [theme, setTheme] = useState("light");

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);

  const storeIcon = useMemo(() => createCustomIcon("#dc2626", "🏪", false), []);
  const customerIcon = useMemo(() => createCustomIcon("#7c3aed", "📍", true), []);

  // Theme observer for dark/light map tiles
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const observer = new MutationObserver(() => {
      const isCurrentlyDark = document.documentElement.classList.contains("dark");
      setTheme(isCurrentlyDark ? "dark" : "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Sync external coords if changed
  useEffect(() => {
    if (
      Math.abs(latitude - position[0]) > 0.0001 ||
      Math.abs(longitude - position[1]) > 0.0001
    ) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Reverse geocode and update coordinates
  const updatePosition = useCallback(
    async (lat: number, lng: number, manualAddress?: string) => {
      setPosition([lat, lng]);
      setGeocoding(true);
      const km = haversineKm(STORE_LAT, STORE_LNG, lat, lng);
      const fee = calcDeliveryFee(km);

      if (manualAddress) {
        setSearchQuery(manualAddress);
        onChange(lat, lng, manualAddress, fee, km);
        setGeocoding(false);
        return;
      }

      try {
        const res = await fetch(`/api/map/reverse?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        const resolvedAddr =
          data.display_name ||
          data.raw_display_name ||
          `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        setSearchQuery(resolvedAddr);
        onChange(lat, lng, resolvedAddr, fee, km);
      } catch {
        const fallbackAddr = `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setSearchQuery(fallbackAddr);
        onChange(lat, lng, fallbackAddr, fee, km);
      } finally {
        setGeocoding(false);
      }
    },
    [onChange]
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search autocomplete
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (q.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/map/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const results = data.results || [];
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  function pickSuggestion(s: any) {
    const lat = Number(s.lat);
    const lng = Number(s.lng);
    const fullAddr = s.title ? `${s.title}, ${s.subtitle}` : s.display_name;
    setSuggestions([]);
    setShowSuggestions(false);
    updatePosition(lat, lng, fullAddr);
  }

  // Geolocation "Use my location"
  function useMyLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingGps(false);
        updatePosition(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocatingGps(false);
        console.warn("Geolocation denied or unavailable:", err.message);
        alert("Could not fetch your location. Please select your address on the map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Marker drag end handler
  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newLatLng = marker.getLatLng();
          updatePosition(newLatLng.lat, newLatLng.lng);
        }
      },
    }),
    [updatePosition]
  );

  const routeLine: [number, number][] = [
    [STORE_LAT, STORE_LNG],
    [position[0], position[1]],
  ];

  return (
    <div className="space-y-3">
      {/* ── Search Input with Autocomplete ──────────────────────────────────── */}
      <div className="relative" ref={searchContainerRef}>
        <div className="relative flex items-center gap-2 bg-white border-2 border-gray-200 focus-within:border-brand-primary rounded-2xl px-4 py-3 shadow-sm transition-all">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search address or area in Ibadan (e.g. Bodija, UI, Ring Road)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 min-w-0"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}

          {searching && (
            <Loader2 size={16} className="text-brand-primary animate-spin shrink-0" />
          )}

          <div className="h-5 w-px bg-gray-200 mx-1" />

          <button
            type="button"
            onClick={useMyLocation}
            disabled={locatingGps}
            className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-dark transition-colors shrink-0 disabled:opacity-50"
            title="Use current GPS location"
          >
            {locatingGps ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Navigation size={15} />
            )}
            <span className="hidden sm:inline">Use My Location</span>
            <span className="sm:hidden">GPS</span>
          </button>
        </div>

        {/* ── Suggestions Dropdown ────────────────────────────────────────────── */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={s.place_id || i}
                type="button"
                onClick={() => pickSuggestion(s)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-violet-50/60 transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <MapPin size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {s.title || s.display_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {s.subtitle || "Ibadan, Oyo State"}
                  </p>
                </div>
                {s.source === "google" && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                    Google
                  </span>
                )}
                {s.source === "locationiq" && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                    LocationIQ
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Interactive Leaflet Map ─────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
        style={{ height: 320 }}
      >
        <MapContainer
          center={[STORE_LAT, STORE_LNG]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            key={theme}
            url={
              theme === "dark"
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            }
            attribution="© OpenStreetMap © CartoDB"
          />

          {/* Route path from Store to Customer Pin */}
          <Polyline
            positions={routeLine}
            pathOptions={{
              color: "#7c3aed",
              weight: 3,
              opacity: 0.75,
              dashArray: "8 6",
            }}
          />

          {/* Store Pin */}
          <Marker position={[STORE_LAT, STORE_LNG]} icon={storeIcon} />

          {/* Customer Draggable Pin */}
          <Marker
            ref={markerRef}
            position={position}
            icon={customerIcon}
            draggable={true}
            eventHandlers={markerEventHandlers}
          />

          <MapController
            lat={position[0]}
            lng={position[1]}
            onMapClick={(lat, lng) => updatePosition(lat, lng)}
          />
        </MapContainer>

        {/* ── Map Instruction / Legend Overlay ──────────────────────────────── */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-gray-100 px-3 py-2 flex flex-col gap-1.5 text-xs font-medium text-gray-700 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />
            <span>AMstores Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-violet-600 rounded-full animate-pulse" />
            <span>Delivery Pin (Drag or Tap)</span>
          </div>
        </div>

        {/* ── Recenter Pin Button ───────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => updatePosition(position[0], position[1])}
          className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md text-gray-700 hover:text-brand-primary p-2.5 rounded-xl shadow-md border border-gray-100 transition-all hover:scale-105 active:scale-95"
          title="Recenter on pin"
        >
          <Compass size={18} />
        </button>

        {/* ── Geocoding Loading Indicator ───────────────────────────────────── */}
        {geocoding && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-xl border border-gray-100 text-sm font-semibold text-gray-800 animate-in fade-in">
              <Loader2 size={16} className="animate-spin text-brand-primary" />
              <span>Pinpointing exact address...</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Distance & Calculated Delivery Fee Card ─────────────────────────── */}
      <div className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-brand-primary/5 border border-violet-200/60 rounded-2xl px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5 text-sm text-gray-700">
          <span className="text-xl">🛵</span>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">
              {distanceKm.toFixed(1)} km from store
            </p>
            <p className="text-xs text-gray-500">Estimated delivery: 25–40 mins</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 block">Delivery fee</span>
          <span className="text-base font-bold text-violet-700">
            ₦{deliveryFee.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Quick helper tip ────────────────────────────────────────────────── */}
      <p className="text-xs text-gray-500 flex items-center gap-1.5 px-1">
        <MapPin size={13} className="text-violet-600 shrink-0" />
        <span>
          <strong>Tip:</strong> Drag the purple pin or tap anywhere on the map to pinpoint your exact gate or street.
        </span>
      </p>
    </div>
  );
}
