import { isProductInStock, isSpecialOrder } from "@/lib/productStock";

export type ProductOrderingType =
  | "available"
  | "special"
  | "preorder"
  | "unavailable";

export type ProductAvailability = {
  type: ProductOrderingType;
  label: string;
  badge: string;
  leadTime: string | null;
};

export function getProductAvailability(
  product:
    | {
        is_in_stock?: boolean | null;
        tags?: Array<{ name: string; slug: string }>;
      }
    | null
    | undefined
): ProductAvailability {
  const isPreorder = (product?.tags ?? []).some((tag) =>
    tag.name.toLowerCase().includes("preorder") ||
    tag.slug.toLowerCase().includes("preorder")
  );

  if (isProductInStock(product)) {
    return {
      type: "available",
      label: "Buy Now",
      badge: "In Stock",
      leadTime: null,
    };
  }

  if (isPreorder) {
    return {
      type: "preorder",
      label: "Pre-order",
      badge: "Pre-order",
      leadTime: "30-45 days",
    };
  }

  if (isSpecialOrder(product)) {
    return {
      type: "special",
      label: "Special Order",
      badge: "Special Order",
      leadTime: "10-12 days",
    };
  }

  return {
    type: "unavailable",
    label: "Out of Stock",
    badge: "Out of Stock",
    leadTime: null,
  };
}

export function requiresOrderWarning(
  availability: ProductAvailability | ProductOrderingType
): boolean {
  const type = typeof availability === "string" ? availability : availability.type;
  return type === "special" || type === "preorder";
}
