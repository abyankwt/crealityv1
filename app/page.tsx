import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MapPin, ShieldCheck, Wrench, HeartHandshake } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import FilterBar from "@/components/store/FilterBar";
import { fetchProducts } from "@/lib/api";

/* ─── Static data ─────────────────────────────────────── */

const categories = [
  {
    title: "3D Printers",
    description: "Industrial FDM systems and core hardware.",
    cta: "View printers →",
    image: "/images/printers.jpg",
    href: "/category/3d-printers",
  },
  {
    title: "Materials",
    description: "Production-grade filaments and resins.",
    cta: "Explore materials →",
    image: "/images/materials.jpg",
    href: "/category/materials",
  },
  {
    title: "Spare Parts",
    description: "Nozzles, build plates, and service kits.",
    cta: "Browse parts →",
    image: "/images/spareparts.jpg",
    href: "/category/spare-parts",
  },
];

const reasons = [
  {
    icon: MapPin,
    title: "Local facility",
    description: "On-ground support and fulfillment in Kuwait.",
  },
  {
    icon: ShieldCheck,
    title: "Authorized inventory",
    description: "Certified Creality hardware and parts.",
  },
  {
    icon: Wrench,
    title: "Technical onboarding",
    description: "Setup, training, and workflow guidance.",
  },
  {
    icon: HeartHandshake,
    title: "Service coverage",
    description: "Maintenance and spare parts availability.",
  },
];

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

/* ─── Page ────────────────────────────────────────────── */

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

  const featuredProducts = products.filter(
    (p) => (p as { featured?: boolean }).featured
  );
  const displayProducts = featuredProducts.length ? featuredProducts : products;

  return (
    <main className="bg-[#f8f8f8] text-gray-900">

      {/* ── 1. Gateway ────────────────────────────────────── */}
      <section className="border-b border-gray-200 bg-[#f8f8f8] py-4 sm:py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">

            {/* Store — primary gateway */}
            <div className="group flex h-full flex-col justify-between gap-4 rounded-2xl border border-gray-300 bg-white p-5 transition duration-150 hover:-translate-y-0.5 hover:border-gray-500 hover:shadow-sm">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                  Gateway 01
                </p>
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                  Store
                </h1>
                <p className="text-sm text-gray-500">
                  Printers, materials, spare parts.
                </p>
              </div>
              <div className="space-y-2">
                <Link
                  href="/store"
                  className="block w-full rounded-lg bg-black px-5 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white transition duration-150 hover:bg-black/85 sm:w-fit"
                >
                  Enter Store
                </Link>
                <p className="text-[11px] text-gray-400">Browse hardware &amp; materials</p>
              </div>
            </div>

            {/* Printing Service — secondary gateway */}
            <div className="group flex h-full flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition duration-150 hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-sm">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                  Gateway 02
                </p>
                <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                  Printing Service
                </h2>
                <p className="text-sm text-gray-500">
                  Custom production &amp; prototyping.
                </p>
              </div>
              <div className="space-y-2">
                <Link
                  href="/printing-service"
                  className="block w-full rounded-lg border border-gray-300 px-5 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-800 transition duration-150 hover:border-gray-600 sm:w-fit"
                >
                  Start Project
                </Link>
                <p className="text-[11px] text-gray-400">Start custom project inquiry</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. Category section ────────────────────────────── */}
      <section className="border-b border-gray-200 bg-white py-7 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-4 sm:mb-5">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Shop by category
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Core hardware and materials aligned to production workflows.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-150 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
              >
                <div className="relative h-28 sm:h-32 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1.5 p-3.5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {category.title}
                  </h3>
                  <p className="text-xs text-gray-500">{category.description}</p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.15em] text-gray-600 transition duration-150 group-hover:text-gray-900">
                    {category.cta}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 + 4. Featured products with Filter bar ──────── */}
      <section className="border-b border-gray-200 bg-[#f8f8f8] py-7 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-4 sm:mb-5">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Featured products
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Ready-to-ship systems and essentials.
            </p>
          </div>

          {/* Filter bar — client component, Suspense boundary required */}
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

      {/* ── 5. Why choose ─────────────────────────────────── */}
      <section className="border-b border-gray-200 bg-white py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-4 sm:mb-5">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Why choose Creality Kuwait
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Focused hardware supply with local technical coverage.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {reasons.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200 bg-[#f9f9f9] p-3.5"
              >
                <Icon
                  className="mb-2.5 h-5 w-5 text-gray-400"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="mt-1.5 text-xs text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Newsletter ─────────────────────────────────── */}
      <section className="bg-[#f8f8f8] py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900">Newsletter</h2>
            <p className="mt-1 text-sm text-gray-500">
              Product updates and service notices. One email per month.
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Email address"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              />
              <button
                type="button"
                className="w-full shrink-0 rounded-lg bg-black px-6 py-3.5 text-sm font-semibold text-white transition duration-150 hover:bg-black/85 sm:w-auto"
                aria-label="Subscribe to newsletter"
              >
                Subscribe
              </button>
            </div>
            <p className="mt-2.5 text-[11px] text-gray-400">
              No spam. Product updates &amp; service notices only.
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
