"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const [drivingDistanceKm, setDrivingDistanceKm] = useState<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const googleMapRef = useRef<google.maps.Map | null>(null);
  const customerMarkerRef = useRef<google.maps.Marker | null>(null);
  const storeMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

  const googleKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";

  // Reverse geocode and update coordinates
  const updatePosition = useCallback(
    async (lat: number, lng: number, manualAddress?: string) => {
      setPosition([lat, lng]);
      setGeocoding(true);

      // Pan map smoothly to new position
      if (googleMapRef.current) {
        googleMapRef.current.panTo({ lat, lng });
      }

      // Update customer marker position
      if (customerMarkerRef.current) {
        customerMarkerRef.current.setPosition({ lat, lng });
      }

      const km = haversineKm(STORE_LAT, STORE_LNG, lat, lng);
      const fee = calcDeliveryFee(km);

      // Calculate real road driving route on Google Maps
      if (directionsServiceRef.current && directionsRendererRef.current) {
        directionsServiceRef.current.route(
          {
            origin: { lat: STORE_LAT, lng: STORE_LNG },
            destination: { lat, lng },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status === "OK" && result) {
              directionsRendererRef.current?.setDirections(result);
              const leg = result.routes?.[0]?.legs?.[0];
              if (leg) {
                if (leg.distance?.value) {
                  setDrivingDistanceKm(leg.distance.value / 1000);
                }
                if (leg.duration?.text) {
                  setRouteDuration(leg.duration.text);
                }
              }
            } else {
              // Clear route if no driving path available
              directionsRendererRef.current?.setDirections({ routes: [] } as any);
              setRouteDuration(null);
            }
          }
        );
      }

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

  // Initialize Google Maps
  useEffect(() => {
    if (!mapContainerRef.current || googleMapRef.current) return;

    if (!googleKey) {
      setMapError("No Google Maps API key provided in .env.local");
      return;
    }

    setOptions({
      key: googleKey,
      v: "weekly",
    });

    Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("routes"),
    ])
      .then(async () => {
        if (!mapContainerRef.current) return;

        const isDark = document.documentElement.classList.contains("dark");

        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: position[0], lng: position[1] },
          zoom: 15,
          mapTypeId: mapType === "hybrid" ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          streetViewControl: false,
          gestureHandling: "greedy",
          styles: isDark
            ? [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                {
                  featureType: "administrative.locality",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#38414e" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#212a37" }],
                },
                {
                  featureType: "road",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#9ca5b3" }],
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#17263c" }],
                },
              ]
            : undefined,
        });

        googleMapRef.current = map;

        // Store Pin (Red Marker)
        const storeMarker = new google.maps.Marker({
          position: { lat: STORE_LAT, lng: STORE_LNG },
          map,
          title: "AMstores Hub",
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 48" width="38" height="48">
                <path d="M19 0C8.5 0 0 8.5 0 19C0 33 19 48 19 48S38 33 38 19C38 8.5 29.5 0 19 0Z" fill="#DC2626"/>
                <circle cx="19" cy="19" r="14" fill="#FFFFFF"/>
                <text x="19" y="24" font-size="14" text-anchor="middle">🏪</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(38, 48),
            anchor: new google.maps.Point(19, 48),
          },
        });
        storeMarkerRef.current = storeMarker;

        // Customer Delivery Pin (Purple Draggable Marker)
        const customerMarker = new google.maps.Marker({
          position: { lat: position[0], lng: position[1] },
          map,
          draggable: true,
          title: "Your Delivery Pin (Drag to relocate)",
          animation: google.maps.Animation.DROP,
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 52" width="42" height="52">
                <path d="M21 0C9.4 0 0 9.4 0 21C0 36 21 52 21 52S42 36 42 21C42 9.4 32.6 0 21 0Z" fill="#7C3AED"/>
                <circle cx="21" cy="21" r="16" fill="#FFFFFF"/>
                <text x="21" y="27" font-size="16" text-anchor="middle">📍</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(42, 52),
            anchor: new google.maps.Point(21, 52),
          },
        });
        customerMarkerRef.current = customerMarker;

        // Marker drag end listener
        customerMarker.addListener("dragend", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            updatePosition(e.latLng.lat(), e.latLng.lng());
          }
        });

        // Click map to reposition pin
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            updatePosition(e.latLng.lat(), e.latLng.lng());
          }
        });

        // Directions renderer for real road routing
        const dirService = new google.maps.DirectionsService();
        const dirRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#7c3aed",
            strokeWeight: 5,
            strokeOpacity: 0.85,
          },
        });

        directionsServiceRef.current = dirService;
        directionsRendererRef.current = dirRenderer;

        // Initial route draw
        dirService.route(
          {
            origin: { lat: STORE_LAT, lng: STORE_LNG },
            destination: { lat: position[0], lng: position[1] },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (res: any, status: any) => {
            if (status === "OK" && res) {
              dirRenderer.setDirections(res);
              const leg = res.routes?.[0]?.legs?.[0];
              if (leg) {
                if (leg.distance?.value) setDrivingDistanceKm(leg.distance.value / 1000);
                if (leg.duration?.text) setRouteDuration(leg.duration.text);
              }
            }
          }
        );

        setMapLoaded(true);
      })
      .catch((err: any) => {
        console.error("Google Maps load error:", err);
        setMapError(err.message || "Could not load Google Maps");
      });
  }, [googleKey, mapType, position, updatePosition]);

  // Handle external lat/lng prop updates
  useEffect(() => {
    if (
      Math.abs(latitude - position[0]) > 0.0001 ||
      Math.abs(longitude - position[1]) > 0.0001
    ) {
      setPosition([latitude, longitude]);
      if (customerMarkerRef.current) {
        customerMarkerRef.current.setPosition({ lat: latitude, lng: longitude });
      }
      if (googleMapRef.current) {
        googleMapRef.current.panTo({ lat: latitude, lng: longitude });
      }
    }
  }, [latitude, longitude, position]);

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
        alert("Could not fetch GPS location. Please drag the pin on Google Maps.");
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

      {/* ── Google Maps Canvas ─────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100"
        style={{ height: 340 }}
      >
        <div ref={mapContainerRef} className="w-full h-full" />

        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Loader2 size={18} className="animate-spin text-brand-primary" />
              <span>Loading Google Maps...</span>
            </div>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 p-4 text-center">
            <p className="text-xs text-red-600">{mapError}</p>
          </div>
        )}

        {/* ── Map Controls: Satellite Toggle & Recenter ────────────────────────── */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const nextType = mapType === "roadmap" ? "hybrid" : "roadmap";
              setMapType(nextType);
              if (googleMapRef.current) {
                googleMapRef.current.setMapTypeId(
                  nextType === "hybrid" ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP
                );
              }
            }}
            className="bg-white/95 backdrop-blur-md text-gray-700 hover:text-brand-primary px-3 py-2 rounded-xl shadow-md border border-gray-100 text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            title="Toggle Satellite / Normal view"
          >
            <Layers size={14} />
            <span>{mapType === "hybrid" ? "Map" : "Satellite"}</span>
          </button>

          <button
            type="button"
            onClick={() => updatePosition(position[0], position[1])}
            className="bg-white/95 backdrop-blur-md text-gray-700 hover:text-brand-primary p-2.5 rounded-xl shadow-md border border-gray-100 transition-all hover:scale-105 active:scale-95"
            title="Recenter on delivery pin"
          >
            <Compass size={16} />
          </button>
        </div>

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
              {(drivingDistanceKm || distanceKm).toFixed(1)} km from store
            </p>
            <p className="text-xs text-gray-500">
              {routeDuration
                ? `Google estimated drive: ~${routeDuration}`
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
          <strong>Tip:</strong> Drag the purple pin or tap anywhere on Google Maps to pinpoint your exact gate or street.
        </span>
      </p>
    </div>
  );
}
