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

export function calculateSpecialOrderFee(product: SpecialOrderPricedProduct) {
  const length = parseFloat(String(product.dimensions?.length || 0));
  const width = parseFloat(String(product.dimensions?.width || 0));
  const height = parseFloat(String(product.dimensions?.height || 0));

  const volume = length * width * height;

  // Formula: (L × W × H) / 6000 × 0.70 × 3
  return Number(((volume / 6000) * 0.70 * 3).toFixed(2));
}
