import { fetchProductCategories } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export async function GET() {
  const categories = await fetchProductCategories({ cache: "no-store" });

  const sorted = [...categories].sort((a, b) => a.slug.localeCompare(b.slug));

  return NextResponse.json({
    total: sorted.length,
    categories: sorted.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parent: c.parent,
    })),
  });
}
