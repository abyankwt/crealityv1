import { Suspense } from "react";
import Link from "next/link";
import CategoryNavigation from "@/components/CategoryNavigation";
import ProductCard from "@/components/ProductCard";
import ProductGrid from "@/components/ProductGrid";
import FilterBar from "@/components/store/FilterBar";
import { fetchProducts, fetchHeroImages } from "@/lib/api";
import CampaignHero from "@/components/CampaignHero";
import { CAMPAIGN_SLIDES } from "@/config/campaigns";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getString(p: RawSearchParams, k: string): string | undefined {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

function resolveSort(sort?: string): { orderby: string; order: "asc" | "desc" } {
  switch (sort) {
    case "price_asc": return { orderby: "price", order: "asc" };
    case "price_desc": return { orderby: "price", order: "desc" };
    case "date_desc": return { orderby: "date", order: "desc" };
    default: return { orderby: "popularity", order: "desc" };
  }
}

type PageProps = {
  searchParams?: Promise<RawSearchParams>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const params: RawSearchParams = await (searchParams ?? Promise.resolve({}));
  const sort = getString(params, "sort");
  const stock = getString(params, "stock");
  const { orderby, order } = resolveSort(sort);

  const { data: products, totalPages, totalProducts } = await fetchProducts({
    orderby,
    order,
    stock_status: stock || undefined,
  });

  const { data: newProducts } = await fetchProducts({
    orderby: "date",
    order: "desc",
    perPage: 8,
  });

  const wpHeroImages = await fetchHeroImages();

  const featuredProducts = products.filter(
    (p) => p.featured
  );

  // Hydrate campaign slides with images from WordPress backend
  // WP newhome slider order: [0]=K2 Plus, [1]=SPARKX i7, [2]=SpacePi, [3]=Halot Sky
  // Our slides order:        [0]=SPARKX i7, [1]=K2 Series, [2]=SpacePi X4L, [3]=HALOT-SKY
  // So we map: slide 0 -> WP 1, slide 1 -> WP 0, slide 2 -> WP 2, slide 3 -> WP 3
  const wpToSlideMap: Record<number, number> = { 0: 1, 1: 0, 2: 2, 3: 3 };

  const dynamicSlides = CAMPAIGN_SLIDES.map((slide, index) => {
    const wpIndex = wpToSlideMap[index] ?? index;
    const wpImg = wpHeroImages[wpIndex] || wpHeroImages[0];

    const p = featuredProducts[index];
    const featuredProImg = p?.images?.[0]?.src;

    const resolvedImage = wpImg || featuredProImg || slide.backgroundImage;

    return {
      ...slide,
      backgroundImage: resolvedImage,
    };
  });

  const displayProducts = featuredProducts.length ? featuredProducts : products;

  return (
    <main className="bg-[#f8f8f8] text-gray-900 pb-10">
      <CampaignHero slides={dynamicSlides} />
      <CategoryNavigation />

      <section className="bg-[#eef0f2] py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                New Hardware Arrivals
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                The latest additions to our production ecosystem.
              </p>
            </div>
            <Link
              href="/store?sort=date_desc"
              className="hidden text-sm font-semibold uppercase tracking-wider text-[#6BBE45] hover:underline sm:block"
            >
              View all new
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {newProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-6 flex justify-center sm:hidden">
            <Link
              href="/store?sort=date_desc"
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-gray-700 hover:bg-gray-50"
            >
              View all new
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f8f8] py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-5 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Featured Products
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Ready-to-ship systems and essentials for professionals.
            </p>
          </div>

          <Suspense fallback={null}>
            <FilterBar totalCount={totalProducts} />
          </Suspense>

          <ProductGrid
            initialProducts={displayProducts}
            initialPage={1}
            totalPages={totalPages}
          />
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#f8f8f8] pt-2 pb-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 max-w-lg mx-auto text-center">
            <h2 className="text-lg font-bold text-gray-900">Be the First to Know</h2>
            <p className="mt-1 text-sm text-gray-500">
              Hardware updates and community drops.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              />
              <button
                type="button"
                className="w-full rounded-lg bg-black px-6 py-3 text-sm font-semibold tracking-wide text-white transition duration-150 hover:bg-gray-800 uppercase"
                aria-label="Subscribe to newsletter"
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
