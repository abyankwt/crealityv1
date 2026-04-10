"use client";

import { useState } from "react";
import Link from "next/link";
import type { SparePartLink, SparePartsGroup } from "@/config/spare-parts";

type SparePartsNavProps = {
  groups: SparePartsGroup[];
  activeSlug: string;
  allHref: string;
  activeItem: SparePartLink;
};

export default function SparePartsNav({
  groups,
  activeSlug,
  allHref,
  activeItem,
}: SparePartsNavProps) {
  const [expanded, setExpanded] = useState(false);

  const activeGroup = groups.find((g) => g.id === activeItem.groupId) ?? groups[0];

  return (
    <div className="mt-4">

      {/* ── MOBILE ── */}
      <div className="lg:hidden">
        {/* Collapsed pill row: shows active chip + toggle */}
        <div className="flex items-center gap-2">
          {/* "All" shortcut */}
          <Link
            href={allHref}
            prefetch
            className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            All
          </Link>

          {/* Active chip (non-interactive, just shows current) */}
          <span className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white">
            {activeItem.label}
          </span>

          {/* Toggle expand */}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="ml-auto shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            aria-expanded={expanded}
          >
            {expanded ? "Close ✕" : "Change"}
          </button>
        </div>

        {/* Expandable panel */}
        {expanded && (
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              {activeGroup.label}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeGroup.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch
                  onClick={() => setExpanded(false)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    item.slug === activeSlug
                      ? "bg-black text-white"
                      : "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP: two-column card grid ── */}
      <div className="mt-4 hidden grid-cols-2 gap-4 lg:grid">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-3xl border border-gray-200 bg-white p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              {group.label}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    item.slug === activeSlug
                      ? "bg-black text-white"
                      : "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
