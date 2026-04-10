import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.trim();

    if (!ids) {
      return NextResponse.json({ error: "ids query param is required." }, { status: 400 });
    }

    const wordpressUrl = process.env.WC_BASE_URL || process.env.WORDPRESS_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wordpressUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json({ error: "WooCommerce credentials not configured." }, { status: 500 });
    }

    const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
    if (idList.length === 0) {
      return NextResponse.json([]);
    }

    const url = new URL(`${wordpressUrl}/wp-json/wc/v3/products`);
    url.searchParams.set("include", idList.join(","));
    url.searchParams.set("per_page", String(idList.length));
    url.searchParams.set("_fields", "id,sku,stock_quantity,manage_stock");

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: `WooCommerce API error: ${response.status}` }, { status: response.status });
    }

    const products = (await response.json()) as Array<{
      id: number;
      sku?: string;
      stock_quantity?: number | null;
      manage_stock?: boolean;
    }>;

    const result = products.map((p) => ({
      id: p.id,
      sku: p.sku ?? null,
      stock_quantity: p.manage_stock ? (p.stock_quantity ?? null) : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
