import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ coords: string[] }> }
) {
  try {
    const { coords } = await params;
    
    // coords is expected to be [z, x, y]
    if (!coords || coords.length < 3) {
      return new NextResponse("Invalid coordinates", { status: 400 });
    }

    const [z, x, y] = coords;

    // Pick a subdomain randomly (a, b, c) like standard Leaflet tile loading
    const subdomains = ["a", "b", "c"];
    const sub = subdomains[Math.floor(Math.random() * subdomains.length)];
    const tileUrl = `https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;

    const response = await fetch(tileUrl, {
      headers: {
        "User-Agent": "AMstores/1.0 (contact: davidadeniyi269@gmail.com)",
      },
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const blob = await response.arrayBuffer();

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200", // Cache tiles for 1 day
      },
    });
  } catch (error: any) {
    console.error("[Map API] Tile proxy error:", error.message);
    return new NextResponse(null, { status: 500 });
  }
}
