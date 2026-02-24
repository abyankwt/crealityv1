"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { NavGroup } from "@/config/store-navigation";
import { STORE_NAVIGATION } from "@/config/store-navigation";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const slugToLabel = (slug: string) =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const flattenCategories = (group: NavGroup): string[] => {
  const direct = group.categories ?? [];
  const nested = group.groups?.flatMap((child) => child.categories ?? []) ?? [];
  return [...new Set([...direct, ...nested])];
};

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const [active, setActive] = useState<string | null>(null);

  // Filter out the featured-only column from the mobile menu
  const navGroups = STORE_NAVIGATION.filter((g) => !g.featured);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">
          Menu
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-200 p-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="h-[calc(100vh-65px)] overflow-y-auto px-5 pb-10 pt-5">
        {/* Top-level nav links */}
        <div className="space-y-1">
          <Link
            href="/store"
            className="block rounded-lg px-2 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50 transition"
            onClick={onClose}
          >
            Store
          </Link>
          <Link
            href="/printing-service"
            className="block rounded-lg px-2 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50 transition"
            onClick={onClose}
          >
            Printing Service
          </Link>
          <Link
            href="/support"
            className="block rounded-lg px-2 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50 transition"
            onClick={onClose}
          >
            Support
          </Link>
        </div>

        {/* Category accordion */}
        <div className="mt-6 space-y-2">
          <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
            Browse by category
          </p>
          {navGroups.map((group) => {
            const isOpen = active === group.title;
            const categories = flattenCategories(group);
            const estimatedHeight = categories.length * 44;

            return (
              <div key={group.title} className="rounded-xl border border-gray-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActive(isOpen ? null : group.title)}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                  aria-expanded={isOpen}
                >
                  {group.title}
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
                      }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-out"
                  style={{ maxHeight: isOpen ? `${estimatedHeight}px` : "0px" }}
                >
                  <div className="border-t border-gray-100 px-4 py-3">
                    <div className="grid gap-1">
                      {group.groups?.map((subgroup) => (
                        <div key={subgroup.title} className="mb-2">
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                            {subgroup.title}
                          </p>
                          {subgroup.categories?.map((slug) => (
                            <Link
                              key={slug}
                              href={`/category/${slug}`}
                              className="block py-1.5 text-sm text-gray-600 transition hover:text-gray-900"
                              onClick={onClose}
                            >
                              {slugToLabel(slug)}
                            </Link>
                          ))}
                        </div>
                      ))}
                      {categories.filter(
                        (slug) =>
                          !group.groups?.flatMap((g) => g.categories ?? []).includes(slug)
                      ).map((slug) => (
                        <Link
                          key={slug}
                          href={`/category/${slug}`}
                          className="block py-2 text-sm text-gray-600 transition hover:text-gray-900"
                          onClick={onClose}
                        >
                          {slugToLabel(slug)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Account section */}
        <div className="mt-8 border-t border-gray-100 pt-6 space-y-1">
          <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
            Account
          </p>
          <Link
            href="/account"
            className="block rounded-lg px-2 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            onClick={onClose}
          >
            Dashboard
          </Link>
          <Link
            href="/account/orders"
            className="block rounded-lg px-2 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            onClick={onClose}
          >
            Orders
          </Link>
          <Link
            href="/cart"
            className="block rounded-lg px-2 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            onClick={onClose}
          >
            Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
