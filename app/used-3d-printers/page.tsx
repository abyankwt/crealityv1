import CatalogPage from "@/components/CatalogPage";
import { fetchUsedPrinterProducts } from "@/lib/usedPrinters";

export const metadata = {
  title: "Used 3D Printers",
};

export default async function Used3DPrintersPage() {
  const { data: products, totalPages } = await fetchUsedPrinterProducts();

  return (
    <CatalogPage
      title="Used 3D Printers"
      products={products}
      totalPages={totalPages}
      section="used_printers"
      apiQuery={{ used_printers: "1" }}
      emptyMessage="No used 3D Printers are available right now."
    />
  );
}
