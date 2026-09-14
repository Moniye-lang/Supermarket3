import { NextResponse } from "next/server";

// Bounding box for Ibadan metro area (min_lon, max_lat, max_lon, min_lat)
const IBADAN_VIEWBOX = "3.7500,7.5500,4.0800,7.2000";
const IBADAN_CENTER = { lat: 7.3775, lng: 3.947 };
const USER_AGENT = "AMstores/1.0 (contact: davidadeniyi269@gmail.com)";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const trimmedQuery = q.trim();
    const googleKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const locationiqKey =
      process.env.LOCATIONIQ_API_KEY ||
      process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;

    // ── Tier 1: LocationIQ Autocomplete (Fastest & Rich details) ─────
    if (locationiqKey && locationiqKey !== "your_locationiq_api_key_here") {
      try {
        const liqUrl = `https://us1.locationiq.com/v1/autocomplete?key=${locationiqKey}&q=${encodeURIComponent(
          trimmedQuery
        )}&viewbox=${IBADAN_VIEWBOX}&countrycodes=ng&limit=8&format=json`;

        const liqRes = await fetch(liqUrl, {
          signal: AbortSignal.timeout(2000),
          next: { revalidate: 3600 },
        });

        if (liqRes.ok && liqRes.headers.get("content-type")?.includes("json")) {
          const liqData = await liqRes.json();
          if (Array.isArray(liqData) && liqData.length > 0) {
            const results = liqData.map((item: any) => {
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
            return NextResponse.json({ results, provider: "locationiq" });
          }
        }
      } catch (liqErr: any) {
        console.warn("[Map Search] LocationIQ error, falling back:", liqErr.message);
      }
    }

    // ── Tier 2: Photon Search (Instant fallback for Nigerian streets/estates) ──
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        trimmedQuery
      )}&lat=${IBADAN_CENTER.lat}&lon=${IBADAN_CENTER.lng}&limit=8`;

      const pRes = await fetch(photonUrl, {
        signal: AbortSignal.timeout(2500),
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: 3600 },
      });

      if (pRes.ok && pRes.headers.get("content-type")?.includes("json")) {
        const pData = await pRes.json();
        if (Array.isArray(pData.features) && pData.features.length > 0) {
          const photonResults = pData.features.map((feat: any) => {
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

          if (photonResults.length > 0) {
            return NextResponse.json({ results: photonResults, provider: "photon" });
          }
        }
      }
    } catch (pErr: any) {
      console.warn("[Map Search] Photon error, falling back:", pErr.message);
    }

    // ── Tier 3: Google Places TextSearch (if API key configured without IP/referer restriction) ─
    if (googleKey && googleKey !== "your_google_maps_api_key_here") {
      try {
        const searchQuery = trimmedQuery.toLowerCase().includes("ibadan")
          ? trimmedQuery
          : `${trimmedQuery}, Ibadan, Nigeria`;

        const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          searchQuery
        )}&location=${IBADAN_CENTER.lat},${IBADAN_CENTER.lng}&radius=25000&region=ng&key=${googleKey}`;

        const gRes = await fetch(googleUrl, {
          signal: AbortSignal.timeout(2500),
          next: { revalidate: 3600 },
        });

        if (gRes.ok && gRes.headers.get("content-type")?.includes("json")) {
          const gData = await gRes.json();
          if (gData.status === "OK" && Array.isArray(gData.results) && gData.results.length > 0) {
            const results = gData.results.slice(0, 8).map((item: any) => ({
              place_id: item.place_id || item.id,
              display_name: item.formatted_address || item.name,
              title: item.name || trimmedQuery,
              subtitle: item.formatted_address || "Ibadan, Oyo State",
              lat: item.geometry?.location?.lat,
              lng: item.geometry?.location?.lng,
              source: "google",
            }));
            return NextResponse.json({ results, provider: "google" });
          }
        }
      } catch (gErr: any) {
        console.warn("[Map Search] Google API error, falling back:", gErr.message);
      }
    }

    // ── Tier 4: Nominatim Search (Fallback) ───────────────────────────
    try {
      const searchQuery = trimmedQuery.toLowerCase().includes("ibadan")
        ? trimmedQuery
        : `${trimmedQuery}, Ibadan`;

      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchQuery
      )}&format=json&addressdetails=1&limit=8&viewbox=${IBADAN_VIEWBOX}&bounded=0&countrycodes=ng`;

      const response = await fetch(nominatimUrl, {
        signal: AbortSignal.timeout(3000),
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "en",
        },
        next: { revalidate: 3600 },
      });

      if (response.ok && response.headers.get("content-type")?.includes("json")) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const results = data.map((item: any) => {
            const addr = item.address || {};
            const mainName =
              addr.amenity ||
              addr.building ||
              addr.shop ||
              addr.road ||
              addr.suburb ||
              item.name ||
              trimmedQuery;

            const area = [
              addr.suburb || addr.neighbourhood || addr.city_district,
              addr.city || "Ibadan",
            ]
              .filter(Boolean)
              .join(", ");

            return {
              place_id: item.place_id,
              display_name: item.display_name,
              title: mainName,
              subtitle: area || "Ibadan, Oyo State",
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              source: "osm",
            };
          });

          return NextResponse.json({ results, provider: "osm" });
        }
      }
    } catch (nErr: any) {
      console.warn("[Map Search] Nominatim error:", nErr.message);
    }

    return NextResponse.json({ results: [] });
  } catch (error: any) {
    console.error("[Map Search API Error]:", error.message);
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}
