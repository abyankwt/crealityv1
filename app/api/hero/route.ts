import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
  try {
    const response = await fetch(
      "https://creality.com.kw/site/wp-json/creality/v1/hero",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Hero API error: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json(), { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch hero slides.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
