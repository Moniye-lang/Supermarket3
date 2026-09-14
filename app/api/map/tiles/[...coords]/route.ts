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
    
    // Parse theme from URL query
    const { searchParams } = new URL(req.url);
    const theme = searchParams.get("theme") || "light";

    const liqKey =
      process.env.LOCATIONIQ_API_KEY ||
      process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;

    let tileUrl = "";

    if (liqKey && liqKey.startsWith("pk.")) {
      const liqSubdomains = ["tiles1", "tiles2", "tiles3", "tiles4"];
      const sub = liqSubdomains[Math.floor(Math.random() * liqSubdomains.length)];
      const style = theme === "dark" ? "dark" : "streets";
      tileUrl = `https://${sub}-tiles.locationiq.com/v3/${style}/r/${z}/${x}/${y}.png?key=${liqKey}`;
    } else {
      const osmSubdomains = ["a", "b", "c"];
      const sub = osmSubdomains[Math.floor(Math.random() * osmSubdomains.length)];
      tileUrl = `https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }

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
