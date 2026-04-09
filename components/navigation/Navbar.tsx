"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User } from "lucide-react";
import { type NavigationItem } from "@/config/navigation";
import { useCart } from "@/context/CartContext";
import type { UserSession } from "@/lib/types";
import type { CategoryNode } from "@/lib/categories";
import type { MaterialsMenuGroup } from "@/lib/materials";
import MobileStoreSwitcher from "@/components/MobileStoreSwitcher";
import SearchBar from "@/components/SearchBar";
import GuestMenu from "@/components/navigation/GuestMenu";
import MaterialsMegaMenu from "@/components/navigation/MaterialsMegaMenu";
import UserMenu from "@/components/navigation/UserMenu";
import StoreSwitcher from "./StoreSwitcher";
import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";

type NavbarProps = {
  categories?: CategoryNode[];
  materialsGroups: MaterialsMenuGroup[];
  navigation: NavigationItem[];
};

type AuthMeResponse =
  | { authenticated: false }
  | {
    authenticated: true;
    user: { id: number; email: string; name: string };
  };

export default function Navbar({
  categories = [],
  materialsGroups,
  navigation,
}: NavbarProps) {
  const { cart } = useCart();
  const itemCount = cart?.items_count ?? 0;
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await response.json()) as AuthMeResponse;
        if (!active) return;
        if (response.ok && data.authenticated) {
          setUser({
            userId: data.user.id,
            email: data.user.email,
            name: data.user.name,
          });
        } else {
          setUser(null);
        }
      } catch {
        if (active) setUser(null);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setAccountOpen(false);
    }
  };

  const isActiveLink = (item: NavigationItem) => {
    if (item.kind === "mega") {
      return pathname.startsWith("/category") || pathname === "/store";
    }

    if (item.kind === "materials") {
      return pathname === "/materials" || pathname.startsWith("/materials/");
    }

    if (item.kind === "account") {
      return (
        pathname.startsWith("/account") ||
        pathname === "/login" ||
        pathname === "/register"
      );
    }

    if (item.id === "printing-service") {
      return (
        pathname === item.href ||
        pathname.startsWith("/printing-service") ||
        pathname.startsWith("/printing-services")
      );
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const navItemBaseClass =
    "relative inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 text-sm font-medium transition";

  const navLinkClass = (item: NavigationItem) =>
    `${navItemBaseClass} ${
      isActiveLink(item)
        ? "bg-gray-100 text-[#0b0b0b]"
        : item.kind === "promotion"
          ? "text-[#7bbf6a] hover:bg-[#f4faef]"
          : "text-gray-600 hover:bg-gray-100 hover:text-[#0b0b0b]"
    }`;

  const accountLabel = user?.name ?? "Account";
  const avatarLetter = user?.name?.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-md border border-gray-200 p-2 text-gray-700 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" prefetch className="relative h-8 w-36">
              <Image
                src="/logo.svg"
                alt="Creality Kuwait"
                fill
                sizes="144px"
                className="object-contain"
                priority
              />
            </Link>
            <div className="hidden lg:flex lg:flex-nowrap lg:items-center lg:gap-6">
              <StoreSwitcher />
              {navigation.map((item) => {
                if (item.kind === "mega") {
                  return (
                    <div
                      key={item.id}
                      className={`relative flex h-9 shrink-0 flex-nowrap items-center whitespace-nowrap ${
                        isActiveLink(item) ? "rounded-full bg-gray-100 px-3 text-[#0b0b0b]" : "rounded-full px-3 text-gray-600"
                      }`}
                    >
                      <MegaMenu
                        label={item.label}
                        href={item.href}
                        categories={categories}
                      />
                    </div>
                  );
                }

                if (item.kind === "materials") {
                  return (
                    <div
                      key={item.id}
                      className={`relative flex h-9 shrink-0 flex-nowrap items-center whitespace-nowrap ${
                        isActiveLink(item)
                          ? "rounded-full bg-gray-100 px-3 text-[#0b0b0b]"
                          : "rounded-full px-3 text-gray-600"
                      }`}
                    >
                      <MaterialsMegaMenu
                        label={item.label}
                        href={item.href}
                        groups={materialsGroups}
                      />
                    </div>
                  );
                }

                if (item.kind === "account") {
                  return (
                    <div key={item.id} className="relative" ref={accountRef}>
                      <button
                        type="button"
                        onClick={() => setAccountOpen((prev) => !prev)}
                        className={`${navLinkClass(item)} gap-2`}
                        aria-haspopup="menu"
                        aria-expanded={accountOpen}
                      >
                        {user ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                            {avatarLetter}
                          </span>
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span>{accountLabel}</span>
                      </button>
                      {accountOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow">
                          <div className="py-2">
                            {user ? (
                              <UserMenu
                                onClose={() => setAccountOpen(false)}
                                onLogout={handleLogout}
                              />
                            ) : (
                              <GuestMenu onClose={() => setAccountOpen(false)} />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    prefetch
                    className={`${navLinkClass(item)} ${item.id === "pre-orders" ? "bg-[#f4faef] text-[#2f5d1d] hover:bg-[#edf7e7]" : ""}`}
                  >
                    <span>{item.label}</span>
                    {item.id === "pre-orders" && (
                      <span className="inline-flex items-center rounded-full bg-[#6BBE45] px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                        New
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <SearchBar />
            <Link
              href="/cart"
              prefetch
              className="relative text-[#0b0b0b] transition hover:text-black"
              aria-label="Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <Link
              href="/cart"
              prefetch
              className="relative rounded-md border border-gray-200 p-2"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              prefetch
              className="rounded-md border border-gray-200 p-2"
              aria-label="Account"
            >
              <User className="h-5 w-5 text-gray-700" />
            </Link>
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <MobileStoreSwitcher />
        </div>
      </div>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        materialsGroups={materialsGroups}
        navigation={navigation}
        categories={categories}
      />
    </header>
  );
}
