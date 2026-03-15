"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, PackagePlus, Printer, ScanLine, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

type CategoryNode = {
  id: "printers" | "accessories" | "scanners";
  title: string;
  description: string;
  href: string;
  icon: typeof Printer;
  children: Array<{
    title: string;
    description: string;
    href: string;
  }>;
};

const CATEGORY_TREE: CategoryNode[] = [
  {
    id: "printers",
    title: "Printers",
    description: "FDM and resin systems for every production tier.",
    href: "/category/3d-printers",
    icon: Printer,
    children: [
      {
        title: "FDM Printers",
        description: "High-speed fused deposition machines.",
        href: "/category/fdm-printers",
      },
      {
        title: "Resin Printers",
        description: "Precision resin platforms and HALOT systems.",
        href: "/category/resin-printers",
      },
    ],
  },
  {
    id: "accessories",
    title: "Accessories",
    description: "Materials, tools, and maintenance essentials.",
    href: "/category/accessories",
    icon: Wrench,
    children: [
      {
        title: "Filaments",
        description: "Production-ready materials and consumables.",
        href: "/category/materials",
      },
      {
        title: "Filament Accessories",
        description: "Dry boxes, handling tools, and support gear.",
        href: "/category/accessories",
      },
      {
        title: "Spare Parts",
        description: "Replacement components for steady uptime.",
        href: "/category/spare-parts",
      },
      {
        title: "Tools",
        description: "Bench essentials for setup and maintenance.",
        href: "/category/tools",
      },
    ],
  },
  {
    id: "scanners",
    title: "Scanners",
    description: "Capture workflows for reverse engineering and design.",
    href: "/category/3d-scanners",
    icon: ScanLine,
    children: [
      {
        title: "Falcon Series",
        description: "Laser capture hardware for detail-focused scanning.",
        href: "/category/falcon-series",
      },
      {
        title: "K Series",
        description: "Compact scanners for studio and field workflows.",
        href: "/category/k-series",
      },
    ],
  },
];

export default function CategoryIconGrid() {
  const [selectedId, setSelectedId] = useState<CategoryNode["id"] | null>(null);

  const selectedCategory = useMemo(
    () => CATEGORY_TREE.find((category) => category.id === selectedId) ?? null,
    [selectedId]
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
            Categories
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[#0b0b0b] sm:text-[28px]">
            Navigate the Creality catalog by workflow.
          </h2>
        </div>
        {selectedCategory ? (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 transition hover:text-[#0b0b0b]"
          >
            <ChevronLeft className="h-4 w-4" />
            All categories
          </button>
        ) : (
          <Link
            href="/store"
            className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 transition hover:text-[#0b0b0b]"
          >
            View all
          </Link>
        )}
      </div>

      {!selectedCategory ? (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {CATEGORY_TREE.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedId(category.id)}
                className="group flex min-h-[150px] flex-col items-center justify-between rounded-3xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md sm:min-h-[180px] sm:p-5"
              >
                <div className="flex w-full justify-center">
                  <div className="rounded-2xl bg-neutral-100 p-2.5 text-gray-900 sm:p-3">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center">
                  <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                    {category.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-gray-500 sm:mt-2 sm:text-sm sm:leading-6">
                    {category.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 transition group-hover:text-gray-700" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                {selectedCategory.title}
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-gray-900">
                Drill into {selectedCategory.title.toLowerCase()}
              </h3>
            </div>
            <Link
              href={selectedCategory.href}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 transition hover:text-gray-600"
            >
              Browse all {selectedCategory.title.toLowerCase()}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {selectedCategory.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className="group flex min-h-[128px] flex-col items-center justify-between rounded-2xl border border-gray-200 bg-neutral-50 p-3.5 text-center transition hover:border-gray-300 hover:bg-white sm:min-h-[136px] sm:p-4"
              >
                <div className="flex w-full justify-center">
                  <div className="rounded-2xl bg-white p-2.5 text-gray-900 shadow-sm sm:p-3">
                    <PackagePlus className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center">
                  <h4 className="text-sm font-semibold text-gray-900 sm:text-base">
                    {child.title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-5 text-gray-500 sm:mt-2 sm:text-sm sm:leading-6">
                    {child.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 transition group-hover:text-gray-700" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
