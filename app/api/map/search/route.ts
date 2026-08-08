import { NextResponse } from "next/server";

// Bounding box for Ibadan metro area (min_lon, max_lat, max_lon, min_lat)
const IBADAN_VIEWBOX = "3.7500,7.5500,4.0800,7.2000";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchQuery = q.toLowerCase().includes("ibadan") ? q : `${q}, Ibadan`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      searchQuery
    )}&format=json&addressdetails=1&limit=8&viewbox=${IBADAN_VIEWBOX}&bounded=1&countrycodes=ng`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AMstores/1.0 (contact: davidadeniyi269@gmail.com)",
        "Accept-Language": "en",
      },
      next: { revalidate: 60 * 60 }, // Cache search queries for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Nominatim API returned status ${response.status}`);
    }

    const data = await response.json();

    // Map and filter results to clean objects
    const results = Array.isArray(data)
      ? data.map((item: any) => {
          const addr = item.address || {};
          const mainName =
            addr.amenity ||
            addr.building ||
            addr.road ||
            addr.suburb ||
            addr.neighbourhood ||
            item.name ||
            q;
          
          const area = [
            addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district,
            "Ibadan",
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
          };
        })
      : [];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("[Map Search API Error]:", error.message);
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}
