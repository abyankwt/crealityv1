type ProductStockLike = {
  is_in_stock?: boolean | null;
};

export function isProductInStock(product: ProductStockLike | null | undefined) {
  return product?.is_in_stock === true;
}

export function isSpecialOrder(product: ProductStockLike | null | undefined) {
  return product?.is_in_stock === false;
}
