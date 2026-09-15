import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromLat = searchParams.get("fromLat");
    const fromLng = searchParams.get("fromLng");
    const toLat = searchParams.get("toLat");
    const toLng = searchParams.get("toLng");

    if (!fromLat || !fromLng || !toLat || !toLng) {
      return NextResponse.json(
        { error: "Missing from/to coordinates" },
        { status: 400 }
      );
    }

    const fLat = parseFloat(fromLat);
    const fLng = parseFloat(fromLng);
    const tLat = parseFloat(toLat);
    const tLng = parseFloat(toLng);

    const liqKey =
      process.env.LOCATIONIQ_API_KEY ||
      process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;

    // ── Tier 1: LocationIQ Driving Directions ─────────────────────────────
    if (liqKey && liqKey.startsWith("pk.")) {
      try {
        const liqUrl = `https://us1.locationiq.com/v1/directions/driving/${fLng},${fLat};${tLng},${tLat}?key=${liqKey}&overview=full&geometries=geojson`;
        const res = await fetch(liqUrl, {
          signal: AbortSignal.timeout(3500),
          next: { revalidate: 86400 },
        });

        if (res.ok) {
          const data = await res.json();
          const route = data.routes?.[0];
          if (route?.geometry?.coordinates) {
            // GeoJSON coordinates are [lon, lat] -> convert to Leaflet [lat, lng]
            const coords: [number, number][] = route.geometry.coordinates.map(
              (c: [number, number]) => [c[1], c[0]]
            );
            return NextResponse.json({
              coordinates: coords,
              distanceKm: route.distance ? route.distance / 1000 : null,
              durationMins: route.duration ? Math.round(route.duration / 60) : null,
              source: "locationiq",
            });
          }
        }
      } catch (err: any) {
        console.warn("[Directions API] LocationIQ error, falling back to OSRM:", err.message);
      }
    }

    // ── Tier 2: OSRM Free Routing Service ─────────────────────────────────
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fLng},${fLat};${tLng},${tLat}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl, {
        signal: AbortSignal.timeout(3500),
        headers: {
          "User-Agent": "AMstores/1.0 (contact: davidadeniyi269@gmail.com)",
        },
        next: { revalidate: 86400 },
      });

      if (res.ok) {
        const data = await res.json();
        const route = data.routes?.[0];
        if (route?.geometry?.coordinates) {
          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          return NextResponse.json({
            coordinates: coords,
            distanceKm: route.distance ? route.distance / 1000 : null,
            durationMins: route.duration ? Math.round(route.duration / 60) : null,
            source: "osrm",
          });
        }
      }
    } catch (osrmErr: any) {
      console.warn("[Directions API] OSRM error:", osrmErr.message);
    }

    // If external routing fails, return empty so UI doesn't draw a crude straight line through buildings
    return NextResponse.json({
      coordinates: [],
      source: "none",
    });
  } catch (error: any) {
    console.error("[Directions API Error]:", error.message);
    return NextResponse.json({ coordinates: [], error: error.message }, { status: 500 });
  }
}
