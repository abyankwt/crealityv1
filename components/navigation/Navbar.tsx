"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { ApiResponse, UserSession } from "@/lib/types";
import StoreSwitcher from "./StoreSwitcher";

const MegaMenu = dynamic(() => import("./MegaMenu"), { ssr: false });
const MobileMenu = dynamic(() => import("./MobileMenu"), { ssr: false });

export default function Navbar() {
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
        const data = (await response.json()) as ApiResponse<UserSession>;
        if (active && response.ok && data.success) {
          setUser(data.data);
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

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
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
            <div
              className={`relative ${pathname?.startsWith("/category") || pathname === "/store"
                ? "text-[#0b0b0b] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:bg-[#7bbf6a]"
                : "text-gray-600"
                }`}
            >
              <MegaMenu label="Products" />
            </div>
            <Link
              href="/downloads"
              className={`relative text-sm font-medium transition hover:text-[#0b0b0b] ${pathname?.startsWith("/downloads")
                ? "text-[#0b0b0b] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:bg-[#7bbf6a]"
                : "text-gray-600"
                }`}
            >
              Downloads
            </Link>
            <Link
              href="/support"
              className={`relative text-sm font-medium transition hover:text-[#0b0b0b] ${pathname === "/support"
                ? "text-[#0b0b0b] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:bg-[#7bbf6a]"
                : "text-gray-600"
                }`}
            >
              Support
            </Link>
          </div>
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href={process.env.NEXT_PUBLIC_WC_CHECKOUT_URL || "https://creality.com.kw/site/checkout/"}
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
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setAccountOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-[#0b0b0b]"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
            >
              <User className="h-4 w-4" />
              Account
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
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Link href={process.env.NEXT_PUBLIC_WC_CHECKOUT_URL || "https://creality.com.kw/site/checkout/"} className="relative rounded-md border border-gray-200 p-2">
            <ShoppingBag className="h-5 w-5 text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <Link href="/account" className="rounded-md border border-gray-200 p-2">
            <User className="h-5 w-5 text-gray-700" />
          </Link>
          <Link href="/store" className="flex items-center justify-center rounded-md border border-gray-200 px-3 py-[7px] text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-[#0b0b0b]">
            Store
          </Link>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
