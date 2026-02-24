"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { NavGroup } from "@/config/store-navigation";
import { STORE_NAVIGATION } from "@/config/store-navigation";

const slugToLabel = (slug: string) =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

type MegaMenuProps = {
  label?: string;
};

export default function MegaMenu({ label = "Products" }: MegaMenuProps) {
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

  const renderColumn = (group: NavGroup) => (
    <div key={group.title} className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
        {group.title}
      </p>
      <div className="space-y-3">
        {group.groups?.map((child) => (
          <div key={child.title} className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-700">{child.title}</p>
            <div className="flex flex-col gap-1.5">
              {child.categories?.map((slug) => (
                <Link
                  key={slug}
                  href={`/category/${slug}`}
                  className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {slugToLabel(slug)}
                </Link>
              ))}
            </div>
          </div>
        ))}
        {group.categories?.map((slug) => (
          <Link
            key={slug}
            href={`/category/${slug}`}
            className="block text-sm text-gray-500 transition-colors hover:text-gray-900"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {slugToLabel(slug)}
          </Link>
        ))}
      </div>
    </div>
  );

  const featured = STORE_NAVIGATION.find((g) => g.featured);
  const columns = STORE_NAVIGATION.filter((g) => !g.featured);

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onFocus={openMenu}
      onBlur={closeMenu}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-[#0b0b0b]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mega panel — CSS transition for no-flicker */}
      <div
        className={`absolute left-1/2 top-full z-50 mt-3 w-[min(960px,90vw)] -translate-x-1/2 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition-all duration-200 ${open
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 -translate-y-1"
          }`}
        role="menu"
        aria-label="Store categories"
      >
        <div className={`grid gap-8 ${featured ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {columns.map((group) => renderColumn(group))}

          {/* Column 4: Featured product */}
          {featured?.featuredProduct && (
            <div className="space-y-4 border-l border-gray-100 pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                Featured
              </p>
              <Link
                href={featured.featuredProduct.href}
                className="group block"
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                <div className="relative h-36 w-full overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={featured.featuredProduct.image}
                    alt={featured.featuredProduct.name}
                    fill
                    sizes="220px"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-black transition">
                    {featured.featuredProduct.name}
                  </p>
                  {featured.featuredProduct.price && (
                    <p className="text-sm font-semibold text-gray-500">
                      {featured.featuredProduct.price}
                    </p>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6BBE45]">
                    View product →
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
