"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Cog, Package } from "lucide-react";
import {
  SPARE_PARTS_CATEGORY_HREF,
  SPARE_PARTS_GROUPS,
} from "@/config/spare-parts";

type SparePartsColumnProps = {
  onNavigate?: () => void;
};

export default function SparePartsColumn({
  onNavigate,
}: SparePartsColumnProps) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  return (
    <div
      className="space-y-4"
      onMouseLeave={() => setOpenGroupId(null)}
    >
      <div>
        <Link
          href={SPARE_PARTS_CATEGORY_HREF}
          prefetch
          className="mb-2 inline-block text-xs font-semibold uppercase tracking-wide text-gray-400"
          onClick={onNavigate}
        >
          Spare Parts
        </Link>

        <div className="space-y-2">
          {SPARE_PARTS_GROUPS.map((group) => {
            const expanded = openGroupId === group.id;
            const contentId = `spare-parts-group-${group.id}`;

            return (
              <div
                key={group.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                onMouseEnter={() => setOpenGroupId(group.id)}
              >
                <button
                  type="button"
                  onFocus={() => setOpenGroupId(group.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                  aria-expanded={expanded}
                  aria-controls={contentId}
                >
                  <span className="text-sm font-medium text-gray-900">
                    {group.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      expanded ? "rotate-180" : "rotate-0"
                    }`}
                    aria-hidden="true"
                  />
                </button>

                <div
                  id={contentId}
                  className={`grid transition-all duration-200 ${
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-gray-200 px-2 py-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          prefetch
                          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-700 transition duration-150 ease-out hover:translate-x-1 hover:bg-white hover:text-black"
                          role="menuitem"
                          onClick={onNavigate}
                        >
                          <Cog
                            className="h-4 w-4 shrink-0 text-gray-400"
                            aria-hidden="true"
                          />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Link
        href={SPARE_PARTS_CATEGORY_HREF}
        prefetch
        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-700 transition duration-150 ease-out hover:translate-x-1 hover:bg-gray-50 hover:text-black"
        onClick={onNavigate}
      >
        <Package className="h-4 w-4 text-gray-400" aria-hidden="true" />
        <span className="font-medium">View All</span>
      </Link>
    </div>
  );
}
