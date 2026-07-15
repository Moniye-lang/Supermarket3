import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng parameters" }, { status: 400 });
    }

    // Call Nominatim reverse geocoding API from the backend
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        // OSM Nominatim requires a valid User-Agent to prevent blocks
        "User-Agent": "AMstores/1.0 (contact: davidadeniyi269@gmail.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API returned status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Map API] Reverse geocode error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
