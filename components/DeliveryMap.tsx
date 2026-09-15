"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Search, Navigation, MapPin, Loader2, X, Compass, Layers } from "lucide-react";

import {
  STORE_LAT,
  STORE_LNG,
  haversineKm,
  calcDeliveryFee,
} from "@/lib/storeHours";

export { STORE_LAT, STORE_LNG, haversineKm, calcDeliveryFee };

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
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationMins, setRouteDurationMins] = useState<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const customerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const storeMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const liqKey =
    process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY ||
    process.env.LOCATIONIQ_API_KEY ||
    "pk.b7b8fe4d83aeeede8f82ee02201b9597";

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  // Theme observer for dark/light map styling
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

  // Update driving road polyline on Mapbox canvas
  const updateRouteLineOnMap = useCallback(
    (coords: [number, number][]) => {
      if (!mapRef.current) return;
      const map = mapRef.current;

      const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coords.map(([lat, lng]) => [lng, lat]), // Mapbox expects [lng, lat]
        },
      };

      const source = map.getSource("driving-route") as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData(geojsonData);
      } else if (map.isStyleLoaded()) {
        map.addSource("driving-route", {
          type: "geojson",
          data: geojsonData,
        });

        map.addLayer({
          id: "driving-route-glow",
          type: "line",
          source: "driving-route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#c084fc",
            "line-width": 8,
            "line-opacity": 0.35,
            "line-blur": 3,
          },
        });

        map.addLayer({
          id: "driving-route-line",
          type: "line",
          source: "driving-route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#7c3aed",
            "line-width": 4.5,
            "line-opacity": 0.9,
          },
        });
      }
    },
    []
  );

  // Fetch real road route geometry
  const fetchRoadRoute = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `/api/map/directions?fromLat=${STORE_LAT}&fromLng=${STORE_LNG}&toLat=${lat}&toLng=${lng}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.coordinates) && data.coordinates.length > 0) {
            updateRouteLineOnMap(data.coordinates);
            if (data.distanceKm) setRouteDistanceKm(data.distanceKm);
            if (data.durationMins) setRouteDurationMins(data.durationMins);
            return;
          }
        }
        updateRouteLineOnMap([]);
      } catch {
        updateRouteLineOnMap([]);
      }
    },
    [updateRouteLineOnMap]
  );

  // Reverse geocode and update coordinates
  const updatePosition = useCallback(
    async (lat: number, lng: number, manualAddress?: string) => {
      setPosition([lat, lng]);
      setGeocoding(true);

      if (mapRef.current) {
        mapRef.current.easeTo({
          center: [lng, lat],
          duration: 800,
        });
      }

      if (customerMarkerRef.current) {
        customerMarkerRef.current.setLngLat([lng, lat]);
      }

      fetchRoadRoute(lat, lng);
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
    [onChange, fetchRoadRoute]
  );

  // Helper to create HTML marker elements
  const createMarkerElement = (bgColor: string, emoji: string, isDraggable: boolean) => {
    const el = document.createElement("div");
    el.className = "mapbox-custom-pin";
    el.style.cssText = `
      position: relative;
      width: 38px;
      height: 38px;
      background: ${bgColor};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: ${isDraggable ? "grab" : "pointer"};
      transition: transform 0.15s ease;
    `;

    const span = document.createElement("span");
    span.style.cssText = "transform: rotate(45deg); font-size: 16px; user-select: none;";
    span.innerText = emoji;
    el.appendChild(span);

    return el;
  };

  // Initialize Mapbox GL
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (mapboxToken) {
      mapboxgl.accessToken = mapboxToken;
    }

    // Determine style: Mapbox standard or LocationIQ Vector (no token required)
    const styleUrl = mapboxToken
      ? theme === "dark"
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/streets-v12"
      : `https://tiles.locationiq.com/v3/${theme === "dark" ? "dark" : "streets"}/vector.json?key=${liqKey}`;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [position[1], position[0]], // [lng, lat]
      zoom: 14.5,
      pitch: 25,
      attributionControl: false,
    });

    // Add navigation controls (zoom & rotate)
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

    // Add Store Marker
    const storeEl = createMarkerElement("#DC2626", "🏪", false);
    const storeMarker = new mapboxgl.Marker({ element: storeEl, anchor: "bottom" })
      .setLngLat([STORE_LNG, STORE_LAT])
      .addTo(map);
    storeMarkerRef.current = storeMarker;

    // Add Draggable Customer Pin
    const customerEl = createMarkerElement("#7C3AED", "📍", true);
    const customerMarker = new mapboxgl.Marker({
      element: customerEl,
      draggable: true,
      anchor: "bottom",
    })
      .setLngLat([position[1], position[0]])
      .addTo(map);

    customerMarker.on("dragend", () => {
      const lngLat = customerMarker.getLngLat();
      updatePosition(lngLat.lat, lngLat.lng);
    });

    customerMarkerRef.current = customerMarker;

    // Map click reposition
    map.on("click", (e) => {
      updatePosition(e.lngLat.lat, e.lngLat.lng);
    });

    map.on("load", () => {
      setMapLoaded(true);
      fetchRoadRoute(position[0], position[1]);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync external coordinates
  useEffect(() => {
    if (
      Math.abs(latitude - position[0]) > 0.0001 ||
      Math.abs(longitude - position[1]) > 0.0001
    ) {
      setPosition([latitude, longitude]);
      if (customerMarkerRef.current) {
        customerMarkerRef.current.setLngLat([longitude, latitude]);
      }
      if (mapRef.current) {
        mapRef.current.easeTo({ center: [longitude, latitude], duration: 800 });
      }
      fetchRoadRoute(latitude, longitude);
    }
  }, [latitude, longitude, position, fetchRoadRoute]);

  // Autocomplete suggestions fetcher
  const fetchSuggestions = useCallback(async (q: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSearching(true);
    try {
      const res = await fetch(`/api/map/search?q=${encodeURIComponent(q.trim())}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      const results = data.results || [];
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);

      if (q.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      searchTimeout.current = setTimeout(() => {
        fetchSuggestions(q);
      }, 350);
    },
    [fetchSuggestions]
  );

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
        console.warn("Geolocation denied:", err.message);
        alert("Could not fetch GPS location. Please drag the pin on the map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

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
            onFocus={() => {
              if (searchQuery.trim().length >= 2) {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                } else {
                  fetchSuggestions(searchQuery);
                }
              }
            }}
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
            {suggestions.map((s: any, i: number) => (
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

      {/* ── Mapbox GL Canvas ────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100"
        style={{ height: 340 }}
      >
        <div ref={mapContainerRef} className="w-full h-full" />

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Loader2 size={18} className="animate-spin text-brand-primary" />
              <span>Loading 3D vector map...</span>
            </div>
          </div>
        )}

        {/* ── Recenter Pin Button ───────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => updatePosition(position[0], position[1])}
          className="absolute top-3 right-14 z-10 bg-white/95 backdrop-blur-md text-gray-700 hover:text-brand-primary p-2.5 rounded-xl shadow-md border border-gray-100 transition-all hover:scale-105 active:scale-95"
          title="Recenter on delivery pin"
        >
          <Compass size={16} />
        </button>

        {/* ── Map Legend Overlay ────────────────────────────────────────────── */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-gray-100 px-3 py-2 flex flex-col gap-1.5 text-xs font-medium text-gray-700 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />
            <span>AMstores Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-violet-600 rounded-full animate-pulse" />
            <span>Delivery Pin (Drag or Tap)</span>
          </div>
        </div>

        {/* ── Geocoding Loading Spinner ─────────────────────────────────────── */}
        {geocoding && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-xs">
            <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-xl border border-gray-100 text-sm font-semibold text-gray-800 animate-in fade-in">
              <Loader2 size={16} className="animate-spin text-brand-primary" />
              <span>Updating address...</span>
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
              {(routeDistanceKm || distanceKm).toFixed(1)} km from store
            </p>
            <p className="text-xs text-gray-500">
              {routeDurationMins
                ? `Estimated drive: ~${routeDurationMins} mins`
                : "Estimated delivery: 25–40 mins"}
            </p>
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
