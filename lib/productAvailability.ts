import type { ProductAvailability as ProductAvailabilityType } from "@/lib/productLogic";

export {
  getProductAvailability,
  type ProductAvailability,
} from "@/lib/productLogic";

export type ProductOrderingType =
  | "available"
  | "special"
  | "preorder"
  | "unavailable";

export function requiresOrderWarning(
  availability: ProductAvailabilityType | ProductOrderingType
) {
  const type = typeof availability === "string" ? availability : availability.type;
  return type === "special" || type === "preorder";
}
