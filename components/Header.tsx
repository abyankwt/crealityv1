"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { useCart } from "@/context/CartContext";
import { ChevronDown, ShoppingBag, User } from "lucide-react";

type SearchResult = {
  id: number;
  name: string;
  slug: string;
  price: string;
  images?: Array<{ src: string }>;
};

type AuthUser = {
  id?: string | number;
  name?: string;
  email?: string;
  [key: string]: unknown;
};

type AuthResponse = {
  user: AuthUser | null;
};

const navLinks = [
  { href: "/category/3d-printers", label: "3D Printers" },
  { href: "/category/materials", label: "Materials" },
  { href: "/category/spare-parts", label: "Spare Parts" },
  { href: "/support", label: "Support" },
];

export default function Header() {
  const { cart } = useCart();
  const itemCount = cart?.items_count ?? 0;
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let isMounted = true;
    const loadAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = (await response.json()) as AuthResponse;
        if (isMounted) {
          setUser(data?.user ?? null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      }
    };

    void loadAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!trimmedQuery) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        const items = Array.isArray(data)
          ? data
          : (data?.products ?? []) as SearchResult[];
        setResults(items.slice(0, 6));
        setIsOpen(true);
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          setResults([]);
          setIsOpen(false);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [trimmedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | globalThis.MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | globalThis.MouseEvent) => {
      if (!accountRef.current) {
        return;
      }
      if (!accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setQuery(next);
    if (!next.trim()) {
      setIsOpen(false);
      setResults([]);
    }
  };

  const handleSelect = (event: MouseEvent<HTMLAnchorElement>) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    event.currentTarget.blur();
  };

  const handleAccountToggle = () => {
    setIsAccountOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setIsAccountOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-6 px-6 py-3 lg:px-8">
        <Link href="/" className="inline-block">
          <Image src="/logo.svg" alt="Creality Kuwait Logo" width={160} height={45} className="object-contain" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-gray-500 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition hover:text-[#0b0b0b] ${pathname === link.href || pathname?.startsWith(`${link.href}/`)
                  ? "text-[#0b0b0b]"
                  : ""
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 justify-center">
          <div className="relative w-full max-w-xs md:max-w-md lg:max-w-lg" ref={containerRef}>
            <label htmlFor="header-search" className="sr-only">
              Search products
            </label>
            <input
              id="header-search"
              type="search"
              value={query}
              onChange={handleChange}
              placeholder="Search products"
              className="h-10 w-full rounded-full border border-gray-200 bg-white px-5 text-sm text-[#0b0b0b] placeholder:text-gray-400 focus:border-black focus:outline-none"
              aria-label="Search products"
              aria-expanded={isOpen}
              autoComplete="off"
            />
            {isOpen && (
              <div className="absolute left-0 right-0 mt-3 max-h-[400px] overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
                {isLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                ) : results.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No results found.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {results.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/product/${item.slug}`}
                          className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50"
                          onClick={handleSelect}
                        >
                          <div className="relative h-[50px] w-[50px] overflow-hidden rounded-lg bg-gray-100">
                            <Image
                              src={item.images?.[0]?.src ?? "/placeholder.png"}
                              alt={item.name}
                              fill
                              sizes="50px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#0b0b0b]">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">{item.price}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5 text-sm text-gray-500">
          <Link
            href={process.env.NEXT_PUBLIC_WC_CHECKOUT_URL || "https://creality.com.kw/site/checkout/"}
            className="relative flex items-center text-[#0b0b0b] transition hover:text-black"
            aria-label="Cart"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              className="flex items-center gap-1 text-gray-500 transition hover:text-[#0b0b0b]"
              aria-haspopup="menu"
              aria-expanded={isAccountOpen}
              onClick={handleAccountToggle}
            >
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm">Account</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${isAccountOpen ? "rotate-180" : "rotate-0"}`}
                aria-hidden="true"
              />
            </button>
            {isAccountOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-xl border border-gray-100 bg-white shadow-lg">
                {user ? (
                  <div className="py-2">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-[#0b0b0b]"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/account?tab=orders"
                      className="block px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-[#0b0b0b]"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      href="/account?tab=addresses"
                      className="block px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-[#0b0b0b]"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      Addresses
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-600 transition hover:bg-gray-50 hover:text-[#0b0b0b]"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="py-2">
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-[#0b0b0b]"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-[#0b0b0b]"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
