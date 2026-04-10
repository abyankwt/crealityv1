import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  Box,
  Cog,
  Droplets,
  Drill,
  Package,
  Printer,
  ScanLine,
  Waves,
  Wrench,
} from "lucide-react";
import type { CategoryNode } from "@/lib/categories";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type CategoryColumnProps = {
  category: CategoryNode;
  onNavigate?: () => void;
};

const CATEGORY_ICONS: Record<string, IconComponent> = {
  "3d-printers": Printer,
  "3d-scanners": ScanLine,
  accessories: Wrench,
  materials: Droplets,
  "laser-milling": Drill,
  "spare-parts": Cog,
  "washing-curing": Waves,
};

function getCategoryIcon(slug: string) {
  return CATEGORY_ICONS[slug] ?? Box;
}

function getCategoryHeading(category: CategoryNode) {
  return category.slug === "accessories"
    ? "Accessories & Tools"
    : category.name;
}

function getCategoryLinks(category: CategoryNode) {
  if (category.children.length > 0) {
    const children = category.children;

    return children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      href:
        category.slug === "3d-printers"
          ? `/3d-printers/${child.slug}`
          : `/category/${child.slug}`,
    }));
  }

  return [
    {
      id: category.id,
      name: category.name,
      slug: category.slug,
      href: `/category/${category.slug}`,
    },
  ];
}

export default function CategoryColumn({
  category,
  onNavigate,
}: CategoryColumnProps) {
  const Icon = getCategoryIcon(category.slug);
  const heading = getCategoryHeading(category);
  const links = getCategoryLinks(category);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/category/${category.slug}`}
          prefetch
          className="mb-2 inline-block text-xs font-semibold uppercase tracking-wide text-gray-400"
          onClick={onNavigate}
        >
          {heading}
        </Link>

        <div className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              prefetch
              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-700 transition duration-150 ease-out hover:translate-x-1 hover:bg-gray-50 hover:text-black"
              role="menuitem"
              onClick={onNavigate}
            >
              <Icon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <span>{link.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <Link
        href={`/category/${category.slug}`}
        prefetch
        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-700 transition duration-150 ease-out hover:translate-x-1 hover:bg-gray-50 hover:text-black"
        onClick={onNavigate}
      >
        <Package className="h-4 w-4 text-gray-400" aria-hidden="true" />
        <span className="font-medium">View All</span>
      </Link>
    </div>
  );
}
