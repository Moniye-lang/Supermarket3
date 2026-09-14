import { NextResponse } from "next/server";

const USER_AGENT = "AMstores/1.0 (contact: davidadeniyi269@gmail.com)";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng parameters" }, { status: 400 });
    }

    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);

    const googleKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const locationiqKey =
      process.env.LOCATIONIQ_API_KEY ||
      process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;

    // ── Tier 1: LocationIQ Reverse Geocoding (if key configured) ──────
    if (locationiqKey && locationiqKey !== "your_locationiq_api_key_here") {
      try {
        const liqUrl = `https://us1.locationiq.com/v1/reverse?key=${locationiqKey}&lat=${nLat}&lon=${nLng}&format=json&addressdetails=1`;
        const liqRes = await fetch(liqUrl, {
          signal: AbortSignal.timeout(4000),
          headers: { "User-Agent": USER_AGENT },
          next: { revalidate: 3600 },
        });

        if (liqRes.ok && liqRes.headers.get("content-type")?.includes("json")) {
          const data = await liqRes.json();
          const addr = data.address || {};
          const street = addr.road || addr.street || addr.pedestrian || "";
          const place =
            addr.amenity ||
            addr.building ||
            addr.shop ||
            addr.suburb ||
            addr.neighbourhood ||
            "";
          const district = addr.city_district || addr.district || addr.suburb || "";
          const city = addr.city || "Ibadan";

          const parts = [
            place !== street ? place : null,
            street,
            district,
            city,
          ].filter(Boolean);

          const cleanAddress =
            parts.length > 0 ? parts.join(", ") : data.display_name;

          return NextResponse.json({
            display_name: cleanAddress || data.display_name,
            address: addr,
            lat: nLat,
            lng: nLng,
            provider: "locationiq",
          });
        }
      } catch (liqErr: any) {
        console.warn("[Map Reverse] LocationIQ error, falling back:", liqErr.message);
      }
    }

    // ── Tier 2: Google Reverse Geocoding (if key is set) ──────────────
    if (googleKey && googleKey !== "your_google_maps_api_key_here") {
      try {
        const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${nLat},${nLng}&key=${googleKey}`;
        const gRes = await fetch(googleUrl, {
          signal: AbortSignal.timeout(4000),
          next: { revalidate: 3600 },
        });
        if (gRes.ok && gRes.headers.get("content-type")?.includes("json")) {
          const gData = await gRes.json();
          if (Array.isArray(gData.results) && gData.results.length > 0) {
            const top = gData.results[0];
            return NextResponse.json({
              display_name: top.formatted_address,
              address: top.address_components,
              lat: nLat,
              lng: nLng,
              provider: "google",
            });
          }
        }
      } catch (gErr: any) {
        console.warn("[Map Reverse] Google error, falling back:", gErr.message);
      }
    }

    // ── Tier 2: Photon Reverse Geocoding (High speed & accurate for Nigeria) ──
    try {
      const photonUrl = `https://photon.komoot.io/reverse?lat=${nLat}&lon=${nLng}`;
      const pRes = await fetch(photonUrl, {
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: 3600 },
      });

      if (pRes.ok && pRes.headers.get("content-type")?.includes("json")) {
        const pData = await pRes.json();
        if (Array.isArray(pData.features) && pData.features.length > 0) {
          const props = pData.features[0].properties || {};
          const name = props.name || "";
          const street = props.street || "";
          const locality = props.locality || props.district || props.county || "";
          const city = props.city || "Ibadan";
          const state = props.state || "Oyo";

          const parts = [
            name !== street ? name : null,
            street,
            locality,
            city !== locality ? city : null,
            state,
          ].filter(Boolean);

          const formatted = parts.length > 0
            ? parts.join(", ")
            : `${nLat.toFixed(4)}, ${nLng.toFixed(4)}`;

          return NextResponse.json({
            display_name: formatted,
            address: props,
            lat: nLat,
            lng: nLng,
            provider: "photon",
          });
        }
      }
    } catch (pErr: any) {
      console.warn("[Map Reverse] Photon error, falling back:", pErr.message);
    }

    // ── Tier 3: BigDataCloud Reverse Geocoding ────────────────────────
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${nLat}&longitude=${nLng}&localityLanguage=en`;
      const bRes = await fetch(bdcUrl, {
        signal: AbortSignal.timeout(3500),
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: 3600 },
      });

      if (bRes.ok && bRes.headers.get("content-type")?.includes("json")) {
        const bData = await bRes.json();
        const parts = [
          bData.locality,
          bData.city !== bData.locality ? bData.city : null,
          bData.principalSubdivision,
          bData.countryName,
        ].filter(Boolean);

        if (parts.length > 0) {
          return NextResponse.json({
            display_name: parts.join(", "),
            address: bData,
            lat: nLat,
            lng: nLng,
            provider: "bigdatacloud",
          });
        }
      }
    } catch (bErr: any) {
      console.warn("[Map Reverse] BigDataCloud error:", bErr.message);
    }

    // ── Tier 4: Nominatim Reverse Geocoding (Fallback) ────────────────
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLng}&zoom=18&addressdetails=1`;
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
        const addr = data.address || {};
        const street = addr.road || addr.street || addr.pedestrian || "";
        const place = addr.amenity || addr.building || addr.shop || addr.suburb || "";
        const district = addr.city_district || addr.district || addr.suburb || "";
        const city = addr.city || "Ibadan";

        const parts = [place !== street ? place : null, street, district, city].filter(Boolean);
        const cleanAddress = parts.length > 0 ? parts.join(", ") : data.display_name;

        return NextResponse.json({
          display_name: cleanAddress || data.display_name,
          address: addr,
          lat: nLat,
          lng: nLng,
          provider: "osm",
        });
      }
    } catch (nErr: any) {
      console.warn("[Map Reverse] Nominatim error:", nErr.message);
    }

    // ── Safe Fallback if all external services are unreachable ────────
    return NextResponse.json({
      display_name: `Pinned Location (${nLat.toFixed(4)}, ${nLng.toFixed(4)})`,
      lat: nLat,
      lng: nLng,
      provider: "coordinates",
    });
  } catch (error: any) {
    console.error("[Map API] Reverse geocode error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
