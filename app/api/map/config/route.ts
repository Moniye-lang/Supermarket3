import { NextResponse } from "next/server";

export async function GET() {
  const googleKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";

  const locationiqKey =
    process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY ||
    process.env.LOCATIONIQ_API_KEY ||
    "";

  const mapboxToken =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    process.env.MAPBOX_ACCESS_TOKEN ||
    "";

  return NextResponse.json({
    googleKey,
    locationiqKey,
    mapboxToken,
  });
}
