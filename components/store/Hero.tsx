import Link from "next/link";
import SmartImage from "@/components/SmartImage";

const trustBadges = [
  "Local inventory in Kuwait",
  "Genuine Creality hardware",
  "1-year warranty",
];

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
      <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        {/* Text column */}
        <div className="order-2 lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
            Creality Store — Kuwait
          </p>
          <h1 className="mt-3 text-[28px] font-semibold leading-[1.08] tracking-tight text-[#0b0b0b] sm:text-[36px] lg:text-[42px]">
            Precision 3D hardware for serious makers.
          </h1>
          <p className="mt-3 max-w-lg text-[15px] text-gray-500">
            Printers, materials, and parts engineered for consistent output.
          </p>

          {/* CTAs */}
          <div className="mt-6 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
            <Link
              href="/category/3d-printers"
              className="inline-flex w-full items-center justify-center rounded-md bg-[#0b0b0b] px-6 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-black/85 active:scale-[0.98] sm:w-auto"
            >
              Shop printers
            </Link>
            <Link
              href="/printing-service"
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-[#0b0b0b] transition duration-150 hover:border-[#0b0b0b] active:scale-[0.98] sm:w-auto"
            >
              Printing service
            </Link>
          </div>

          {/* Trust micro-badges */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {trustBadges.map((badge) => (
              <div
                key={badge}
                className="flex items-center gap-1.5 text-[12px] text-gray-500"
              >
                <svg
                  className="h-3.5 w-3.5 flex-shrink-0 text-[#6BBE45]"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
                </svg>
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Image column */}
        <div className="order-1 lg:order-2">
          <SmartImage
            src="/images/store-hero-new.jpg"
            alt="Creality 3D printer with printed models"
            mode="banner"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-xl shadow-md"
          />
        </div>
      </div>
    </section>
  );
}
