import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import { getPrinterSubmenuCategoryBySlug } from "@/lib/categories";
import { fetchPrinterSubmenuProducts } from "@/lib/catalog";

export const revalidate = 300;

type PrinterCategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function resolvePrinterCategory(slug: string) {
  return getPrinterSubmenuCategoryBySlug(slug);
}

export async function generateMetadata(
  { params }: PrinterCategoryPageProps
): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolvePrinterCategory(slug);

  if (!category) {
    return {
      title: "3D Printers | Creality Kuwait",
    };
  }

  return {
    title: `${category.name} | 3D Printers | Creality Kuwait`,
  };
}

export default async function PrinterCategoryPage({
  params,
}: PrinterCategoryPageProps) {
  const { slug } = await params;
  const category = await resolvePrinterCategory(slug);

  if (!category) {
    notFound();
  }

  const result = await fetchPrinterSubmenuProducts({
    submenuSlug: category.slug,
    page: 1,
    perPage: 12,
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
          3D Printers
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 sm:text-4xl">
          {category.name}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {result.totalProducts} {result.totalProducts === 1 ? "product" : "products"}
        </p>
      </div>

      <ProductGrid
        initialProducts={result.data}
        initialPage={1}
        totalPages={result.totalPages}
        filterBySection={false}
        productSectionOverride={
          category.slug === "resin-series" ? "default" : undefined
        }
        apiQuery={{
          printer_submenu_slug: category.slug,
        }}
        emptyMessage={`No products found in ${category.name}.`}
      />
    </section>
  );
}
