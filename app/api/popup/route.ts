import { fetchHomepagePopup } from "@/lib/creality-cms";

export const revalidate = 3600;

export async function GET() {
  const data = await fetchHomepagePopup();
  return Response.json(data, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
