import { NextResponse } from "next/server";

// Bounding box for Ibadan metro area (min_lon, max_lat, max_lon, min_lat)
const IBADAN_VIEWBOX = "3.7500,7.5500,4.0800,7.2000";
const IBADAN_CENTER = { lat: 7.3775, lng: 3.947 };
const USER_AGENT = "AMstores/1.0 (contact: davidadeniyi269@gmail.com)";

// In-memory cache for blazing fast repeat queries (<1ms response)
const searchCache = new Map<string, { results: any[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const trimmedQuery = q.trim();
    const cacheKey = trimmedQuery.toLowerCase();

    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ results: cached.results, cached: true });
    }

    const locationiqKey =
      process.env.LOCATIONIQ_API_KEY ||
      process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;

    // Helper: LocationIQ fetcher
    const fetchLocationIQ = async () => {
      if (!locationiqKey || locationiqKey === "your_locationiq_api_key_here") {
        return [];
      }
      try {
        const liqUrl = `https://us1.locationiq.com/v1/autocomplete?key=${locationiqKey}&q=${encodeURIComponent(
          trimmedQuery
        )}&viewbox=${IBADAN_VIEWBOX}&countrycodes=ng&limit=6&format=json`;

        const res = await fetch(liqUrl, {
          signal: AbortSignal.timeout(2000),
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            return data.map((item: any) => {
              const addr = item.address || {};
              const mainTitle =
                item.display_place ||
                addr.name ||
                addr.road ||
                item.display_name?.split(",")[0] ||
                trimmedQuery;
              const subtitle =
                item.display_address ||
                [addr.suburb, addr.city || "Ibadan", addr.state || "Oyo"]
                  .filter(Boolean)
                  .join(", ");

              return {
                place_id: item.place_id || item.osm_id?.toString() || Math.random().toString(),
                display_name: item.display_name,
                title: mainTitle,
                subtitle: subtitle || "Ibadan, Nigeria",
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                source: "locationiq",
              };
            });
          }
        }
      } catch (err: any) {
        console.warn("[Map Search] LocationIQ parallel error:", err.message);
      }
      return [];
    };

    // Helper: Photon fetcher
    const fetchPhoton = async () => {
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          trimmedQuery
        )}&lat=${IBADAN_CENTER.lat}&lon=${IBADAN_CENTER.lng}&limit=6`;

        const res = await fetch(photonUrl, {
          signal: AbortSignal.timeout(2000),
          headers: { "User-Agent": USER_AGENT },
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.features)) {
            return data.features.map((feat: any) => {
              const props = feat.properties || {};
              const coords = feat.geometry?.coordinates || [IBADAN_CENTER.lng, IBADAN_CENTER.lat];
              const title = props.name || props.street || trimmedQuery;
              const subtitle = [
                props.locality || props.district,
                props.city || props.county || "Ibadan",
                props.state || "Oyo",
              ]
                .filter(Boolean)
                .join(", ");

              return {
                place_id: props.osm_id?.toString() || Math.random().toString(),
                display_name: [title, subtitle].filter(Boolean).join(", "),
                title,
                subtitle: subtitle || "Ibadan, Nigeria",
                lat: coords[1],
                lng: coords[0],
                source: "photon",
              };
            });
          }
        }
      } catch (err: any) {
        console.warn("[Map Search] Photon parallel error:", err.message);
      }
      return [];
    };

    // Run both LocationIQ and Photon in parallel for maximum speed & completeness
    const [liqResults, photonResults] = await Promise.all([
      fetchLocationIQ(),
      fetchPhoton(),
    ]);

    // Merge and deduplicate by title / coordinates
    const combined: any[] = [];
    const seenTitles = new Set<string>();

    for (const item of [...liqResults, ...photonResults]) {
      const normalizedTitle = (item.title || "").toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle) && item.lat && item.lng) {
        seenTitles.add(normalizedTitle);
        combined.push(item);
      }
    }

    // Cache the top 8 results
    const finalResults = combined.slice(0, 8);
    if (finalResults.length > 0) {
      searchCache.set(cacheKey, {
        results: finalResults,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ results: finalResults });
  } catch (error: any) {
    console.error("[Map Search API Error]:", error.message);
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}
