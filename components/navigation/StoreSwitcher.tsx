"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type StoreOption = {
  label: string;
  href: string;
  description: string;
};

const OPTIONS: StoreOption[] = [
  {
    label: "Store",
    href: "/store",
    description: "Hardware, materials, and parts",
  },
  {
    label: "Printing",
    href: "/printing-services",
    description: "Custom jobs and enterprise support",
  },
];

export default function StoreSwitcher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentLabel =
    pathname.startsWith("/printing-service") ||
    pathname.startsWith("/printing-services")
      ? "Printing"
      : "Store";

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white whitespace-nowrap text-sm font-medium text-gray-700 transition hover:border-gray-300"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {currentLabel}
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 mt-3 w-60 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg"
          role="menu"
        >
          {OPTIONS.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="block rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <p className="font-semibold text-gray-900">{option.label}</p>
              <p className="text-xs text-gray-500">{option.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
