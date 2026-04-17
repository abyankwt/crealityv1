export const revalidate = 3600;

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

    const upstreamUrl = `${baseUrl}/wp-json/creality/v1/hero`;

    const res = await fetch(upstreamUrl, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error("Hero API upstream error:", res.status);
      return Response.json([]);
    }

    const data = await res.json();

    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("Hero API error:", error);
    return Response.json([]);
  }
}
