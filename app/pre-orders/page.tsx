import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import CatalogPage from "@/components/CatalogPage";
import CatalogPageSkeleton from "@/components/CatalogPageSkeleton";
import { buildCatalogApiQuery, fetchCatalogProducts } from "@/lib/catalog";

export const metadata = { title: "Pre-Orders" };

const getCachedPreOrders = unstable_cache(
  () => fetchCatalogProducts({ orderType: "pre_order" }),
  ["pre-orders"],
  { revalidate: 3600 }
);

async function PreOrderProducts() {
  const { data: products, totalPages } = await getCachedPreOrders();

  return (
    <CatalogPage
      title="Pre-Orders"
      products={products}
      totalPages={totalPages}
      section="preorders"
      apiQuery={buildCatalogApiQuery({ orderType: "pre_order" })}
      emptyMessage="No pre-order products are available right now."
    />
  );
}

export default function PreOrdersPage() {
  return (
    <Suspense fallback={<CatalogPageSkeleton />}>
      <PreOrderProducts />
    </Suspense>
  );
}
