"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Printer, ShoppingCart } from "lucide-react";

type SwitcherItem = {
  href: string;
  label: string;
  icon: typeof ShoppingCart;
  isActive: boolean;
};

export default function MobileStoreSwitcher() {
  const pathname = usePathname();
  const isPrintingRoute =
    pathname.startsWith("/printing-service") ||
    pathname.startsWith("/printing-services");

  const items: SwitcherItem[] = [
    {
      href: "/store",
      label: "Store",
      icon: ShoppingCart,
      isActive: !isPrintingRoute,
    },
    {
      href: "/printing-services",
      label: "Printing",
      icon: Printer,
      isActive: isPrintingRoute,
    },
  ];

  return (
    <div className="md:hidden">
      <div className="flex w-full rounded-xl border border-gray-200 bg-gray-100 p-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
                item.isActive
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
