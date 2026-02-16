import Link from "next/link";

const footerLinks = [
  {
    title: "Shop",
    links: [
      { href: "/category/3d-printers", label: "3D Printers" },
      { href: "/category/materials", label: "Materials" },
      { href: "/category/spare-parts", label: "Spare Parts" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/support", label: "Help Center" },
      { href: "/support/shipping", label: "Shipping" },
      { href: "/support/warranty", label: "Warranty" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/account", label: "Account" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {footerLinks.map((group) => (
            <div key={group.title} className="space-y-4">
              <p className="text-sm font-semibold text-text">
                {group.title}
              </p>
              <nav className="flex flex-col gap-3 text-sm text-gray-500">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="transition hover:text-text"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-gray-200 pt-6 text-sm text-gray-500">
          © {new Date().getFullYear()} Creality Kuwait. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
