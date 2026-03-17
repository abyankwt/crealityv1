"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User } from "lucide-react";
import {
  PRE_ORDERS_SECTION_ID,
  type NavigationItem,
} from "@/config/navigation";
import { useCart } from "@/context/CartContext";
import { scrollToSectionById } from "@/lib/scrollToSection";
import type { UserSession } from "@/lib/types";
import type { CategoryNode } from "@/lib/categories";
import MobileStoreSwitcher from "@/components/MobileStoreSwitcher";
import SearchBar from "@/components/SearchBar";
import StoreSwitcher from "./StoreSwitcher";
import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";

type NavbarProps = {
  categories?: CategoryNode[];
  navigation: NavigationItem[];
};

type AuthMeResponse =
  | { authenticated: false }
  | {
    authenticated: true;
    user: { id: number; email: string; name: string };
  };

export default function Navbar({ categories = [], navigation }: NavbarProps) {
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
        if (active && response.ok && data.authenticated) {
          setUser({
            userId: data.user.id,
            email: data.user.email,
            name: data.user.name,
          });
        }
      } catch {
        if (active) setUser(null);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

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

  const navLinkClass = (item: NavigationItem) =>
    `relative text-sm font-medium transition hover:text-[#0b0b0b] ${
      isActiveLink(item)
        ? "text-[#0b0b0b] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:bg-[#7bbf6a]"
        : item.kind === "promotion"
          ? "text-[#7bbf6a]"
          : "text-gray-600"
    }`;

  const handleNavigationClick =
    (item: NavigationItem) => (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (item.id !== "pre-orders" || pathname !== "/") {
        return;
      }

      event.preventDefault();

      const didScroll = scrollToSectionById(PRE_ORDERS_SECTION_ID);

      if (!didScroll) {
        window.location.assign(item.href);
      }
    };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-md border border-gray-200 p-2 text-gray-700 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="relative h-8 w-36">
              <Image
                src="/logo.svg"
                alt="Creality Kuwait"
                fill
                sizes="144px"
                className="object-contain"
                priority
              />
            </Link>
            <div className="hidden lg:flex lg:items-center lg:gap-6">
              <StoreSwitcher />
              {navigation.map((item) => {
                if (item.kind === "mega") {
                  return (
                    <div key={item.id} className={`relative ${navLinkClass(item)}`}>
                      <MegaMenu
                        label={item.label}
                        href={item.href}
                        categories={categories}
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
                        className={`${navLinkClass(item)} flex items-center gap-1.5`}
                        aria-haspopup="menu"
                        aria-expanded={accountOpen}
                      >
                        <User className="h-4 w-4" />
                        {item.label}
                      </button>
                      {accountOpen && (
                        <div className="absolute right-0 mt-3 w-48 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
                          {user ? (
                            <>
                              <Link
                                href="/account"
                                className="block rounded-md px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                                onClick={() => setAccountOpen(false)}
                              >
                                Dashboard
                              </Link>
                              <Link
                                href="/account/orders"
                                className="block rounded-md px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                                onClick={() => setAccountOpen(false)}
                              >
                                Orders
                              </Link>
                              <Link
                                href="/account/addresses"
                                className="block rounded-md px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                                onClick={() => setAccountOpen(false)}
                              >
                                Addresses
                              </Link>
                              <button
                                type="button"
                                onClick={handleLogout}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                              >
                                Logout
                              </button>
                            </>
                          ) : (
                            <>
                              <Link
                                href="/login"
                                className="block rounded-md px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                                onClick={() => setAccountOpen(false)}
                              >
                                Login
                              </Link>
                              <Link
                                href="/register"
                                className="block rounded-md px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                                onClick={() => setAccountOpen(false)}
                              >
                                Register
                              </Link>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={navLinkClass(item)}
                    onClick={handleNavigationClick(item)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <SearchBar />
            <Link
              href="/cart"
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
              className="rounded-md border border-gray-200 p-2"
              aria-label="Account"
            >
              <User className="h-5 w-5 text-gray-700" />
            </Link>
          </div>
        </div>

        <div className="mt-3 lg:hidden">
          <MobileStoreSwitcher />
        </div>
      </div>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navigation={navigation}
      />
    </header>
  );
}
