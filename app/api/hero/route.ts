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

    const upstreamUrl = `${baseUrl}/wp-json/creality/v1/hero`;

    console.log("[hero-api] Fetching hero slides from:", upstreamUrl);

    const res = await fetch(upstreamUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Hero API upstream error:", res.status);
      return Response.json([]);
    }

    const data = await res.json();

    console.log("FULL HERO DATA:", data);

    return Response.json(data);
  } catch (error) {
    console.error("Hero API error:", error);
    return Response.json([]);
  }
}
