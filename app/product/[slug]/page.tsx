import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchRelatedStoreProducts,
  fetchStoreProductBySlugNoStore,
} from "@/lib/store";
import ProductDetail from "@/components/ProductDetail";

export const revalidate = 60;

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const stripHtml = (value?: string | null) =>
  value ? value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";

export async function generateMetadata(
  { params }: ProductPageProps
): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchStoreProductBySlugNoStore(slug);
  if (!product) {
    return {
      title: "Product not found | Creality Kuwait",
    };
  }

  const description =
    stripHtml(product.short_description) || stripHtml(product.description);

  return {
    title: `${product.name} | Creality Kuwait`,
    description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchStoreProductBySlugNoStore(slug);

  if (!product) {
    console.warn(`[ProductPage] Missing product slug: ${slug}`);
    redirect("/store");
  }

  const relatedProducts = await fetchRelatedStoreProducts(product);

  return <ProductDetail product={product} relatedProducts={relatedProducts} />;
}
