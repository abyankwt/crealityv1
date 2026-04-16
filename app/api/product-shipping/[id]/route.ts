import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const productId = id?.trim();

    if (!productId) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    // Read env vars — WC_BASE_URL is the canonical var in .env.local;
    // fall back to WORDPRESS_URL for backwards-compat.
    const wordpressUrl = process.env.WC_BASE_URL || process.env.WORDPRESS_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    // Debug logs (server-side only — never sent to the browser)
    console.log("[product-shipping] WC_BASE_URL:", process.env.WC_BASE_URL);
    console.log("[product-shipping] WORDPRESS_URL:", process.env.WORDPRESS_URL);
    console.log("[product-shipping] WC_CONSUMER_KEY:", consumerKey ? `${consumerKey.slice(0, 6)}…` : "undefined");
    console.log("[product-shipping] WC_CONSUMER_SECRET:", consumerSecret ? `${consumerSecret.slice(0, 6)}…` : "undefined");

    if (!wordpressUrl) {
      console.error("[product-shipping] ❌ Missing WC_BASE_URL / WORDPRESS_URL");
      return NextResponse.json(
        { error: "WooCommerce base URL is not configured (WC_BASE_URL / WORDPRESS_URL)." },
        { status: 500 }
      );
    }

    if (!consumerKey) {
      console.error("[product-shipping] ❌ Missing WC_CONSUMER_KEY");
      return NextResponse.json(
        { error: "WooCommerce consumer key is not configured (WC_CONSUMER_KEY)." },
        { status: 500 }
      );
    }

    if (!consumerSecret) {
      console.error("[product-shipping] ❌ Missing WC_CONSUMER_SECRET");
      return NextResponse.json(
        { error: "WooCommerce consumer secret is not configured (WC_CONSUMER_SECRET)." },
        { status: 500 }
      );
    }

    // Build the WooCommerce REST API URL
    const url = `${wordpressUrl}/wp-json/wc/v3/products/${encodeURIComponent(productId)}`;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    console.log("[product-shipping] Fetching:", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[product-shipping] ❌ WooCommerce API error ${response.status}:`,
        errorText
      );
      return NextResponse.json(
        { error: `WooCommerce API error: ${response.status}` },
        { status: response.status }
      );
    }

    const product = (await response.json()) as {
      id?: number;
      name?: string;
      sku?: string;
      weight?: string | number | null;
      dimensions?: {
        length?: string | number | null;
        width?: string | number | null;
        height?: string | number | null;
      } | null;
    };

    // Full debug log to identify the product and its shipping fields
    console.log("[product-shipping] ✅ Product found:", {
      id: product.id,
      name: product.name,
      sku: product.sku,
      weight: product.weight,
      dimensions: product.dimensions,
    });

    return NextResponse.json({
      weight: product.weight ?? null,
      dimensions: product.dimensions ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown shipping data error.";
    console.error("[product-shipping] ❌ Unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
