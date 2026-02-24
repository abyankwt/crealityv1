"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import useCompare from "./useCompare";

export default function CompareBar() {
  const pathname = usePathname();
  const { items, removeItem, clearAll } = useCompare();

  const visible = pathname !== "/compare" && items.length >= 2;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur transition-transform duration-300 ease-out ${visible ? "translate-y-0" : "translate-y-full"
        }`}
      aria-hidden={!visible}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            Compare
          </span>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white pl-1 pr-2.5 py-1"
            >
              {item.image && (
                <div className="relative h-5 w-5 overflow-hidden rounded-full bg-gray-100 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name ?? "Product"}
                    fill
                    sizes="20px"
                    className="object-cover"
                  />
                </div>
              )}
              <span className="text-xs font-semibold text-gray-700">
                {item.name ? item.name.slice(0, 16) : `#${item.id}`}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="ml-0.5 text-gray-400 hover:text-gray-700 transition text-sm leading-none"
                aria-label={`Remove ${item.name ?? "item"} from compare`}
              >
                ×
              </button>
            </div>
          ))}
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <Link
            href="/compare"
            className="flex-1 rounded-lg bg-black px-5 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gray-800 sm:flex-none"
          >
            Compare {items.length}
          </Link>
        </div>
      </div>
    </div>
  );
}
