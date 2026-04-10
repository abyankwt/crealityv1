type SpecialOrderPricedProduct = {
  id?: string | number | null;
  weight?: string | number | null;
  dimensions?: {
    length?: string | number | null;
    width?: string | number | null;
    height?: string | number | null;
  } | null;
};

export type { SpecialOrderPricedProduct };

export function calculateSpecialOrderFee(
  product: SpecialOrderPricedProduct,
  quantity = 1,
) {
  let length = parseFloat(String(product.dimensions?.length || 0));
  let width  = parseFloat(String(product.dimensions?.width  || 0));
  let height = parseFloat(String(product.dimensions?.height || 0));

  // WooCommerce dimension unit is a global setting (cm or mm).
  // Some products are entered in mm instead of cm.
  // Heuristic: no real shipping box exceeds 300 cm (3 m) on any side.
  // If any dimension > 300, the values are in mm — divide by 10 to get cm.
  if (Math.max(length, width, height) > 300) {
    length /= 10;
    width  /= 10;
    height /= 10;
  }

  const volumeCm3 = length * width * height;

  // Volumetric weight formula: (L × W × H in cm³) / 6000 × rate × quantity
  // Rate: 0.70 KWD/kg × factor of 3
  const feePerUnit = (volumeCm3 / 6000) * 0.70 * 3;
  return Number((feePerUnit * quantity).toFixed(3));
}
