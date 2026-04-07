export const dynamic = "force-dynamic";
export const revalidate = 0;

function getWordPressBaseUrl() {
  return (
    process.env.WORDPRESS_URL?.trim() ||
    process.env.NEXT_PUBLIC_WC_BASE_URL?.trim() ||
    process.env.WC_BASE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
}

export async function GET() {
  try {
    const baseUrl = getWordPressBaseUrl();

    if (!baseUrl) {
      console.error("[hero-api] Missing WORDPRESS_URL / NEXT_PUBLIC_WC_BASE_URL / WC_BASE_URL");
      return Response.json([]);
    }

    // Cache-bust upstream to bypass LiteSpeed / Cloudflare / WordPress object cache
    const upstreamUrl = `${baseUrl}/wp-json/creality/v1/hero?t=${Date.now()}`;

    console.log("[hero-api] Fetching hero slides from:", upstreamUrl);

    const res = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });

    if (!res.ok) {
      console.error("Hero API upstream error:", res.status);
      return Response.json([]);
    }

    const data = await res.json();

    console.log("FULL HERO DATA:", data);

    // Set no-cache headers on our proxy response so CDN/browser never caches
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Hero API error:", error);
    return Response.json([]);
  }
}
