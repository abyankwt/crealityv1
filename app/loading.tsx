import ProductCardSkeleton from "@/components/ProductCardSkeleton";

export default function HomeLoading() {
  return (
    <main className="bg-[#f8f8f8] text-gray-900 pb-10">
      {/* Hero skeleton */}
      <div className="w-full animate-pulse bg-gray-200" style={{ aspectRatio: "16/5", minHeight: 220 }} />

      {/* Pre-order banner skeleton */}
      <section className="bg-[#f8f8f8] py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="animate-pulse overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 p-6 sm:p-8 h-28" />
        </div>
      </section>

      {/* Category nav skeleton */}
      <section className="py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="animate-pulse flex-shrink-0 h-20 w-24 rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals skeleton */}
      <section className="bg-[#eef0f2] py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6">
            <div className="animate-pulse h-7 w-56 rounded bg-gray-200" />
            <div className="animate-pulse mt-2 h-4 w-80 rounded bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </section>

      {/* Featured products skeleton */}
      <section className="bg-[#f8f8f8] py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-5">
            <div className="animate-pulse h-7 w-48 rounded bg-gray-200" />
            <div className="animate-pulse mt-2 h-4 w-72 rounded bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
