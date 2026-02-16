import Link from "next/link";

const navLinks = [
  { href: "/category/3d-printers", label: "3D Printers" },
  { href: "/category/materials", label: "Materials" },
  { href: "/category/spare-parts", label: "Spare Parts" },
  { href: "/support", label: "Support" },
];

const actionLinks = [
  { href: "/search", label: "Search" },
  { href: "/cart", label: "Cart" },
  { href: "/account", label: "Account" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="text-base font-medium text-text">
          Creality Kuwait
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-gray-500 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6 text-sm text-gray-500">
          {actionLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-text"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
