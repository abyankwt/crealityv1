import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchProductBySlug, type WCProduct } from "@/lib/api";
import ProductDetail from "@/components/ProductDetail";

type ProductPageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata(
  { params }: ProductPageProps
): Promise<Metadata> {
  const product = await fetchProductBySlug(params.slug);
  if (!product) {
    return {
      title: "Product not found | Creality Kuwait",
    };
  }

  return {
    title: `${product.name} | Creality Kuwait`,
    description: product.short_description || product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await fetchProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product as WCProduct} />;
}
