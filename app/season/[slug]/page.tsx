import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { fetchProductsByIds } from "@/lib/api";
import { fetchSeasonalCampaign } from "@/lib/creality-cms";
import { normalizeImageUrl, shouldBypassImageOptimization } from "@/lib/image";
import { filterProductsForSection } from "@/lib/productLogic";

export const revalidate = 60;

type SeasonPageProps = {
  params: Promise<{ slug: string }>;
};

function sortProductsByCampaignOrder<T extends { id: number }>(
  productIds: number[],
  products: T[]
) {
  const productOrder = new Map(productIds.map((id, index) => [id, index]));

  return [...products].sort((left, right) => {
    const leftIndex = productOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = productOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

export async function generateMetadata({
  params,
}: SeasonPageProps): Promise<Metadata> {
  const [{ slug }, campaign] = await Promise.all([
    params,
    fetchSeasonalCampaign(),
  ]);

  if (!campaign?.enabled || campaign.slug !== slug) {
    return {
      title: "Seasonal Campaign | Creality Kuwait",
    };
  }

  return {
    title: `${campaign.nav_label} | Creality Kuwait`,
    description:
      campaign.hero.subtitle || `Shop the ${campaign.nav_label} seasonal campaign.`,
  };
}

export default async function SeasonPage({ params }: SeasonPageProps) {
  const [{ slug }, campaign] = await Promise.all([params, fetchSeasonalCampaign()]);

  if (
    !campaign?.enabled ||
    !campaign.slug ||
    campaign.slug !== slug
  ) {
    notFound();
  }

  const productResult =
    campaign.products.length > 0
      ? await fetchProductsByIds(campaign.products)
      : { data: [], totalPages: 0, totalProducts: 0 };
  const visibleProducts = filterProductsForSection(productResult.data, "default");
  const orderedProducts = sortProductsByCampaignOrder(campaign.products, visibleProducts);
  const heroImage = normalizeImageUrl(campaign.hero.image);

  return (
    <main className="bg-[#f8f8f8] pb-12 text-gray-900">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6BBE45]">
              Seasonal Campaign
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">
              {campaign.hero.title || campaign.nav_label}
            </h1>
            {campaign.hero.subtitle ? (
              <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
                {campaign.hero.subtitle}
              </p>
            ) : null}
          </div>

          <div className="relative aspect-[5/4] overflow-hidden rounded-[28px] bg-gray-100 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={campaign.hero.title || campaign.nav_label}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 460px"
                className="object-cover"
                unoptimized={shouldBypassImageOptimization(heroImage)}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#f4faef] to-[#dce9d4] px-8 text-center text-sm font-medium text-gray-600">
                Seasonal campaign hero
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            Campaign Products
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Products for this landing page are managed directly from WordPress CMS.
          </p>
        </div>

        {orderedProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
            No products are currently assigned to this campaign.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {orderedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
