import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const key = process.env.WOOCOMMERCE_CONSUMER_KEY || "";
const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET || "";
const baseUrl = process.env.WOOCOMMERCE_URL || "https://wc.agbenimercantilestores.com";

console.log("=== WooCommerce Auth Diagnostic ===");
console.log("URL:", baseUrl);
console.log("Consumer Key starts with:", key.substring(0, 8) + "...");
console.log("Consumer Secret starts with:", secret.substring(0, 8) + "...");

async function testAuth(label: string, url: string, headers: Record<string, string> = {}) {
  console.log(`\n--- ${label} ---`);
  try {
    const r = await fetch(url, { headers });
    console.log("HTTP Status:", r.status, r.statusText);
    const body = await r.text();
    console.log("Response:", body.substring(0, 400));
  } catch (e: any) {
    console.error("Fetch error:", e.message);
  }
}

(async () => {
  // Test 1: Query string auth
  await testAuth(
    "Query String Auth",
    `${baseUrl}/wp-json/wc/v3/products?consumer_key=${key}&consumer_secret=${secret}&per_page=3`
  );

  // Test 2: Basic Auth header only
  const b64 = Buffer.from(`${key}:${secret}`).toString("base64");
  await testAuth(
    "Basic Auth Header",
    `${baseUrl}/wp-json/wc/v3/products?per_page=3`,
    { Authorization: `Basic ${b64}` }
  );

  // Test 3: Both combined
  await testAuth(
    "Combined (Query + Header)",
    `${baseUrl}/wp-json/wc/v3/products?consumer_key=${key}&consumer_secret=${secret}&per_page=3`,
    { Authorization: `Basic ${b64}` }
  );
})();
