export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch(
      "https://creality.com.kw/site/wp-json/creality/v1/hero",
      {
        cache: "no-store",
      }
    );

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
