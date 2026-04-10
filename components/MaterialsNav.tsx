"use client";

import { useState } from "react";
import Link from "next/link";
import type { MaterialsMenuGroup } from "@/lib/materials";

type MaterialsNavProps = {
  groups: MaterialsMenuGroup[];
  activeSlug: string;
  allHref: string;
  activeGroupId: string;
  activeLabel: string;
};

export default function MaterialsNav({
  groups,
  activeSlug,
  allHref,
  activeGroupId,
  activeLabel,
}: MaterialsNavProps) {
  const [expanded, setExpanded] = useState(false);

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];

  return (
    <div className="mt-6">

      {/* ── MOBILE ── */}
      <div className="lg:hidden">
        {/* Collapsed pill row */}
        <div className="flex items-center gap-2">
          <Link
            href={allHref}
            prefetch
            className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            All
          </Link>

          <span className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white">
            {activeLabel}
          </span>

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
              {activeGroup.links.map((link) => (
                <Link
                  key={link.slug}
                  href={link.href}
                  prefetch
                  onClick={() => setExpanded(false)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    link.slug === activeSlug
                      ? "bg-black text-white"
                      : "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP: two-column card grid ── */}
      <div className="hidden grid-cols-2 gap-4 lg:grid">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-[1.5rem] border border-gray-200 bg-white p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              {group.label}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {group.links.map((link) => (
                <Link
                  key={link.slug}
                  href={link.href}
                  prefetch
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    link.slug === activeSlug
                      ? "bg-black text-white"
                      : "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
