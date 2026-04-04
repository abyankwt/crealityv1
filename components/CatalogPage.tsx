import ProductGrid from "@/components/ProductGrid";
import type { ProductSection } from "@/lib/productLogic";
import type { Product } from "@/lib/woocommerce-types";

type CatalogPageProps = {
  title: string;
  products: Product[];
  totalPages: number;
  section?: ProductSection;
  apiQuery?: Record<string, string | number | undefined>;
  emptyMessage?: string;
};

export default function CatalogPage({
  title,
  products,
  totalPages,
  section = "default",
  apiQuery,
  emptyMessage,
}: CatalogPageProps) {
  const headingTitle = title.replace(/\b3d\b/i, "3D");

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
          {headingTitle}
        </h1>
      </div>

      <ProductGrid
        initialProducts={products}
        initialPage={1}
        totalPages={totalPages}
        section={section}
        apiQuery={apiQuery}
        emptyMessage={emptyMessage}
      />
    </section>
  );
}
