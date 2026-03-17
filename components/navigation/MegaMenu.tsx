"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CategoryNode } from "@/lib/categories";
import CategoryColumn from "./CategoryColumn";

type MegaMenuProps = {
  label?: string;
  href?: string;
  categories: CategoryNode[];
};

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

  // Only show parent categories that have children, or are standalone
  const visibleCategories = categories.filter(
    (c) => c.children.length > 0 || categories.length <= 6
  );

  // Determine grid columns based on count
  const colCount = Math.min(visibleCategories.length, 4);
  const gridClass =
    colCount <= 2
      ? "lg:grid-cols-2"
      : colCount === 3
        ? "lg:grid-cols-3"
        : "lg:grid-cols-4";

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
      </div>

      {/* Mega panel */}
      <div
        className={`absolute left-1/2 top-full z-50 mt-3 w-[min(960px,90vw)] -translate-x-1/2 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition-all duration-200 ${open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
          }`}
        role="menu"
        aria-label="Store categories"
      >
        {visibleCategories.length === 0 ? (
          <p className="text-sm text-gray-400">No categories available.</p>
        ) : (
          <div className={`grid gap-8 ${gridClass}`}>
            {visibleCategories.map((cat) => (
              <CategoryColumn
                key={cat.id}
                category={cat}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
