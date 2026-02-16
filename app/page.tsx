"use client";

import Image from "next/image";
import ProductCard from "@/components/ProductCard";

const mockProducts = [
  {
    imageUrl: "/products/k1-max.jpg",
    title: "Creality K1 Max 3D Printer",
    price: 499.0,
    slug: "creality-k1-max",
    inStock: true,
  },
  {
    imageUrl: "/products/ender-3-v3.jpg",
    title: "Ender-3 V3 CoreXZ",
    price: 269.0,
    slug: "ender-3-v3",
    inStock: true,
  },
  {
    imageUrl: "/products/filament-pla.jpg",
    title: "Hyper PLA Filament",
    price: 24.5,
    slug: "hyper-pla",
    inStock: true,
  },
  {
    imageUrl: "/products/space-pi.jpg",
    title: "Space Pi Filament Dryer",
    price: 89.99,
    slug: "space-pi-dryer",
    inStock: false,
  },
];

const categories = [
  {
    title: "3D Printers",
    description: "Flagship FDM machines built for speed and precision.",
    image: "/images/printers.jpg",
    href: "/category/3d-printers",
  },
  {
    title: "Materials",
    description: "Premium PLA, ABS, and specialty materials.",
    image: "/images/materials.jpg",
    href: "/category/materials",
  },
  {
    title: "Spare Parts",
    description: "Nozzles, build plates, and essential upgrades.",
    image: "/images/spareparts.jpg",
    href: "/category/spare-parts",
  },
];

const trustItems = [
  {
    title: "Fast delivery across Kuwait",
    description: "Reliable shipping and tracking.",
  },
  {
    title: "Genuine Creality products",
    description: "Certified inventory only.",
  },
  {
    title: "Expert local support",
    description: "Specialists on the ground.",
  },
  {
    title: "1-year warranty",
    description: "Service backed coverage.",
  },
];

const reasons = [
  {
    title: "Local fulfillment",
    description: "Same-week delivery across Kuwait with updates.",
  },
  {
    title: "Certified inventory",
    description: "Authorized hardware and materials only.",
  },
  {
    title: "Guided setup",
    description: "Installation, training, and onboarding.",
  },
  {
    title: "Service coverage",
    description: "Long-term maintenance plans.",
  },
];

export default function HomePage() {
  return (
    <main className="bg-neutral text-text">
      <section
        aria-labelledby="hero-heading"
        className="bg-gradient-to-b from-white to-gray-50 py-20 sm:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2 lg:px-8">
          <div className="flex flex-col gap-6">
            <div className="max-w-xl space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">
                Creality Kuwait
              </p>
              <h1
                id="hero-heading"
                className="text-4xl font-semibold tracking-tight text-text sm:text-5xl lg:text-[64px]"
              >
                Premium 3D printing for studios and creators.
              </h1>
              <p className="text-base text-gray-500 sm:text-lg">
                Curated Creality systems, materials, and service delivered with
                local expertise for production-ready workflows.
              </p>
              <p className="text-2xl font-semibold text-text">From KWD 189</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                className="rounded-2xl bg-[#6BBE45] px-8 py-4 text-sm font-semibold text-white transition duration-300 ease-out hover:opacity-90"
                aria-label="Shop Creality printers"
              >
                Shop printers
              </button>
              <button
                className="rounded-2xl border border-black px-8 py-4 text-sm font-semibold transition duration-300 ease-out hover:bg-black hover:text-white"
                aria-label="Explore Creality materials"
              >
                Explore materials
              </button>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-2xl">
              <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(107,190,69,0.18),_transparent_60%)]" />
              <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl transition duration-300 ease-out hover:-translate-y-1">
                <Image
                  src="/images/printers.jpg"
                  alt="Creality K1 Max printer"
                  width={1200}
                  height={900}
                  className="h-auto max-h-[620px] w-full object-cover transition duration-500 ease-out hover:scale-105"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Trust indicators" className="bg-neutral py-6">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm text-text shadow-sm">
                ○
              </span>
              <div>
                <p className="text-sm font-semibold text-text">{item.title}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="category-heading"
        className="bg-white py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-2 sm:mb-12">
            <h2 id="category-heading" className="text-3xl font-semibold text-text">
              Shop by category
            </h2>
            <p className="text-sm text-gray-500">
              Commercial-grade gear curated for every workflow.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {categories.map((category) => (
              <a
                key={category.title}
                href={category.href}
                className="group relative h-56 overflow-hidden rounded-[20px] border border-border bg-neutral transition duration-300 ease-out hover:-translate-y-1 hover:shadow-xl"
                aria-label={`Shop ${category.title}`}
              >
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover transition duration-300 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition duration-300 ease-out group-hover:from-black/80" />
                <div className="absolute bottom-5 left-5 right-5 space-y-2 text-white">
                  <h3 className="text-xl font-semibold">{category.title}</h3>
                  <p className="text-sm text-white/80">{category.description}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    Shop now
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="featured-heading"
        className="bg-neutral py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 text-center sm:mb-10">
            <h2 id="featured-heading" className="text-3xl font-semibold text-text">
              Featured products
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Bestsellers ready to ship across Kuwait.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {mockProducts.map((product) => (
              <ProductCard
                key={product.slug}
                imageUrl={product.imageUrl}
                title={product.title}
                price={product.price}
                slug={product.slug}
                inStock={product.inStock}
                onAddToCart={() => {}}
              />
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="brand-heading" className="bg-[#F5F5F5] py-20">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <h2 id="brand-heading" className="text-3xl font-semibold text-text sm:text-4xl">
            Engineered for precision.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-500 sm:text-base">
            Enterprise-grade printers and materials built for repeatable, reliable
            output in professional environments.
          </p>
          <button
            className="mt-6 rounded-2xl bg-[#6BBE45] px-8 py-4 text-sm font-semibold text-white transition duration-300 ease-out hover:opacity-90"
            aria-label="Explore the Creality lineup"
          >
            Explore the lineup
          </button>
        </div>
      </section>

      <section aria-labelledby="why-heading" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8">
            <h2 id="why-heading" className="text-3xl font-semibold text-text">
              Why choose Creality Kuwait
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Local expertise paired with premium support.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="rounded-2xl border border-border bg-neutral p-5 shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm text-text shadow-sm">
                  ○
                </div>
                <h3 className="mt-4 text-base font-semibold text-text">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="newsletter-heading" className="bg-neutral py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm sm:p-12">
            <h2 id="newsletter-heading" className="text-3xl font-semibold text-text">
              Newsletter
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Product launches, creator tips, and local offers delivered monthly.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Email address"
                className="w-full max-w-sm rounded-2xl border border-border bg-white px-5 py-3 text-sm text-text placeholder:text-gray-400 focus:border-black focus:outline-none"
              />
              <button
                className="rounded-2xl bg-[#6BBE45] px-8 py-4 text-sm font-semibold text-white transition duration-300 ease-out hover:opacity-90"
                aria-label="Subscribe to newsletter"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
