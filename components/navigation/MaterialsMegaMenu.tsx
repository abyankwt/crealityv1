"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { MaterialsMenuGroup } from "@/lib/materials";

type MaterialsMegaMenuProps = {
  groups: MaterialsMenuGroup[];
  label?: string;
  href?: string;
};

export default function MaterialsMegaMenu({
  groups,
  label = "Materials",
  href = "/materials",
}: MaterialsMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }

    setOpen(true);
  };

  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onFocus={openMenu}
      onBlur={closeMenu}
    >
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Link href={href} prefetch className="transition hover:text-[#0b0b0b]">
          {label}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
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
        className={`absolute left-1/2 top-full z-50 mt-3 w-[min(680px,92vw)] -translate-x-1/2 rounded-3xl border border-gray-100 bg-white shadow-2xl transition-all duration-150 ease-out ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
        role="menu"
        aria-label="Materials categories"
      >
        <div className="grid gap-8 p-6 md:grid-cols-2">
          {groups.map((group) => (
            <div key={group.id} className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  {group.label}
                </p>
                <div className="mt-4 space-y-1">
                  {group.links.map((link) => (
                    <div key={link.slug}>
                      <Link
                        href={link.href}
                        prefetch
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-gray-700 transition hover:border-gray-200 hover:bg-gray-50 hover:text-black"
                        role="menuitem"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="h-4 w-4 text-gray-300" aria-hidden="true" />
                      </Link>
                      {link.children && link.children.length > 0 && (
                        <div className="mb-1 ml-3 space-y-0.5 border-l border-gray-100 pl-3">
                          {link.children.map((child) => (
                            <Link
                              key={child.slug}
                              href={child.href}
                              prefetch
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-gray-500 transition hover:bg-gray-50 hover:text-black"
                              role="menuitem"
                            >
                              <span className="h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
