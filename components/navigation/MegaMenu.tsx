"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Boxes, Sparkles } from "lucide-react";
import type { CategoryNode } from "@/lib/categories";
import CategoryColumn from "./CategoryColumn";

type MegaMenuProps = {
  label?: string;
  href?: string;
  categories: CategoryNode[];
};

type CategoryGroup = {
  id: string;
  categories: CategoryNode[];
};

const GROUP_BLUEPRINT = [
  {
    id: "machines",
    slugs: ["3d-printers", "3d-scanners", "laser-milling"],
  },
  {
    id: "materials",
    slugs: ["materials", "washing-curing"],
  },
  {
    id: "essentials",
    slugs: ["accessories", "spare-parts"],
  },
] as const;

function buildCategoryGroups(categories: CategoryNode[]): CategoryGroup[] {
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));
  const used = new Set<string>();

  const groups: CategoryGroup[] = GROUP_BLUEPRINT.map((group) => {
    const groupCategories = group.slugs
      .map((slug) => {
        const category = categoryMap.get(slug);
        if (category) {
          used.add(slug);
        }
        return category;
      })
      .filter((category): category is CategoryNode => Boolean(category));

    return {
      id: group.id,
      categories: groupCategories,
    };
  }).filter((group) => group.categories.length > 0);

  const remaining = categories.filter((category) => !used.has(category.slug));
  if (remaining.length > 0) {
    groups.push({
      id: "more",
      categories: remaining,
    });
  }

  return groups.slice(0, 3);
}

export default function MegaMenu({
  label = "Products",
  href,
  categories,
}: MegaMenuProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const visibleCategories = categories.filter(
    (category) => category.children.length > 0 || categories.length <= 8
  );
  const groupedCategories = buildCategoryGroups(visibleCategories);

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onFocus={openMenu}
      onBlur={closeMenu}
    >
      <div className="flex items-center gap-1.5 text-sm font-medium">
        {href ? (
          <Link href={href} className="transition hover:text-[#0b0b0b]">
            {label}
          </Link>
        ) : (
          <span>{label}</span>
        )}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center transition hover:text-[#0b0b0b]"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Toggle ${label} menu`}
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              open ? "rotate-180" : "rotate-0"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div
        className={`absolute left-1/2 top-full z-50 mt-3 w-[min(1080px,92vw)] -translate-x-1/2 rounded-3xl border border-gray-100 bg-white shadow-2xl transition-all duration-150 ease-out ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
        role="menu"
        aria-label="Store categories"
      >
        {groupedCategories.length === 0 ? (
          <div className="p-6">
            <p className="text-sm text-gray-400">No categories available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 items-start gap-8 p-6">
            {groupedCategories.map((group) => (
              <div key={group.id} className="space-y-4">
                {group.categories.map((category) => (
                  <CategoryColumn
                    key={category.id}
                    category={category}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </div>
            ))}

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Featured
              </p>
              <Link
                href="/store"
                onClick={() => setOpen(false)}
                className="group block overflow-hidden rounded-xl bg-white shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-36 w-full overflow-hidden">
                  <Image
                    src="/images/store-hero-new.jpg"
                    alt="Creality featured products"
                    fill
                    sizes="260px"
                    className="object-cover transition duration-150 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                      <Sparkles className="h-4 w-4 text-white/80" />
                      Staff Picks
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-white">
                      Discover the full Creality lineup
                    </h3>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <p className="text-sm leading-relaxed text-gray-600">
                    Explore machines, materials, and essentials curated for
                    production-ready workflows and fast upgrades.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-700 transition duration-150 ease-out group-hover:translate-x-1 group-hover:bg-gray-50 group-hover:text-black">
                      <Boxes className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      <span>Shop all product categories</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-700 transition duration-150 ease-out group-hover:translate-x-1 group-hover:bg-gray-50 group-hover:text-black">
                      <ArrowRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      <span className="font-medium">View All</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
