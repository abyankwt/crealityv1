import "server-only";

import {
  SUPPORT_SERVICE_SLUG_GROUPS,
  type SupportService,
} from "@/lib/supportServices";
import { getWooProductsBySlugs } from "@/lib/woo-client";

const FALLBACK_SUPPORT_SERVICE_IMAGE = "/images/product-placeholder.svg";

function parseSupportServicePrice(price?: string) {
  const parsedPrice = parseFloat(price ?? "0");

  return Number.isFinite(parsedPrice) ? parsedPrice : 0;
}

function stripHtml(value?: string) {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchSupportServices(): Promise<SupportService[]> {
  const result = await getWooProductsBySlugs(
    SUPPORT_SERVICE_SLUG_GROUPS.flatMap((group) => [
      group.primarySlug,
      ...(group.fallbackSlugs ?? []),
    ])
  );

  if (!result.ok) {
    return [];
  }

  const productsBySlug = new Map(
    result.data.map((product) => [product.slug, product] as const)
  );

  const products = SUPPORT_SERVICE_SLUG_GROUPS.flatMap((group) => {
    const product = [group.primarySlug, ...(group.fallbackSlugs ?? [])]
      .map((slug) => productsBySlug.get(slug))
      .find((candidate) => Boolean(candidate));

    if (!product) {
      return [];
    }

    return [product];
  });

  return products.map((product) => ({
    id: product.id,
    title: product.name,
    description: stripHtml(product.short_description),
    price: parseSupportServicePrice(product.price),
    image: product.images?.[0]?.src || FALLBACK_SUPPORT_SERVICE_IMAGE,
    slug: product.slug,
  }));
}
