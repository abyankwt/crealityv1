import { NextRequest, NextResponse } from "next/server";
import { fetchProducts } from "@/lib/woocommerce";
import { isServiceListingProduct } from "@/lib/productLogic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json([]);
    }

    const { data: products } = await fetchProducts({
      search: q,
      perPage: 20,
      cache: "no-store",
    });

    // For search: show all product types (in-stock, special order, pre-order)
    // but exclude internal service listings that are not customer-facing products.
    const results = products
      .filter((p) => !isServiceListingProduct(p))
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.formatted_price,
        images: p.images?.map((img) => ({ src: img.src })) ?? [],
      }));

    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
