export function formatPrice(price: number | string | null | undefined) {
  return `${Number(price ?? 0).toFixed(2)} KD`;
}

export function getProductPriceInfo(product: {
  regular_price?: number | string | null;
  sale_price?: number | string | null;
  price?: number | string | null;
}) {
  const regularPrice = Number(product.regular_price ?? 0);
  const salePrice = Number(product.sale_price ?? 0);
  const currentPrice = Number(product.price ?? salePrice ?? regularPrice ?? 0);
  const hasSale =
    Number.isFinite(regularPrice) &&
    Number.isFinite(salePrice) &&
    regularPrice > 0 &&
    salePrice > 0 &&
    salePrice < regularPrice;

  return {
    regularPrice,
    salePrice,
    currentPrice,
    hasSale,
  };
}
