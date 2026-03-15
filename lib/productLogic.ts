import { isProductInStock, isSpecialOrder } from "@/lib/productStock";

type ProductTagLike =
  | string
  | {
    name?: string | null;
    slug?: string | null;
  };

type ProductLike = {
  is_in_stock?: boolean | null;
  tags?: ProductTagLike[] | null;
  name?: string | null;
};

export type ProductAvailability = {
  type: "preorder" | "available" | "special";
  label: "Pre-Order" | "Add to Cart" | "Special Order";
  lead?: string;
};

function isPreorderTag(tag: ProductTagLike) {
  if (typeof tag === "string") {
    return tag.toLowerCase() === "preorder";
  }

  return [tag.name, tag.slug].some(
    (value) => value?.toLowerCase().includes("preorder") ?? false
  );
}

export function getProductAvailability(
  product: ProductLike | null | undefined
): ProductAvailability {
  const isPreorder = product?.tags?.some(isPreorderTag);

  if (isProductInStock(product)) {
    return {
      type: "available",
      label: "Add to Cart",
    };
  }

  if (isPreorder) {
    return {
      type: "preorder",
      label: "Pre-Order",
      lead: "Delivery: 30-45 days",
    };
  }

  if (isSpecialOrder(product)) {
    return {
      type: "special",
      label: "Special Order",
      lead: "Delivery: 10-12 days",
    };
  }

  return {
    type: "special",
    label: "Special Order",
    lead: "Delivery: 10-12 days",
  };
}
