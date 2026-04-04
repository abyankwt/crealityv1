import CatalogPage from "@/components/CatalogPage";
import { buildCatalogApiQuery, fetchCatalogProducts } from "@/lib/catalog";

export const metadata = {
  title: "Pre-Orders",
};

export default async function PreOrdersPage() {
  const { data: products, totalPages } = await fetchCatalogProducts({
    orderType: "pre_order",
  });

  return (
    <CatalogPage
      title="Pre-Orders"
      products={products}
      totalPages={totalPages}
      section="preorders"
      apiQuery={buildCatalogApiQuery({
        orderType: "pre_order",
      })}
      emptyMessage="No pre-order products are available right now."
    />
  );
}
