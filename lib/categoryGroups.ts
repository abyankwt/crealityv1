import type { CategoryNode } from "@/lib/categories";

export type CategoryGroup = {
  id: string;
  label: string;
  categories: CategoryNode[];
};

export type MobileCategorySection = {
  id: string;
  label: string;
  category: CategoryNode;
  allLabel: string;
};

/**
 * Materials has its own dedicated grouped navigation (Filament / Resin).
 * Exclude it from generic category listings to prevent flat rendering.
 */
const EXCLUDED_CATEGORY_SLUGS = new Set(["materials", "washing-curing"]);

const GROUP_BLUEPRINT = [
  {
    id: "machines",
    label: "3D Printers",
    slugs: ["3d-printers", "3d-scanners", "laser-milling"],
  },
  {
    id: "essentials",
    label: "Accessories",
    slugs: ["accessories", "spare-parts"],
  },
] as const;

const MOBILE_SECTION_BLUEPRINT = [
  {
    id: "3d-printers",
    label: "3D Printers",
    slug: "3d-printers",
    allLabel: "All 3D Printers",
  },
  {
    id: "3d-scanners",
    label: "3D Scanners",
    slug: "3d-scanners",
    allLabel: "All 3D Scanners",
  },
  {
    id: "laser-milling",
    label: "Laser & Milling",
    slug: "laser-milling",
    allLabel: "All Laser & Milling",
  },

  {
    id: "accessories-tools",
    label: "Accessories & Tools",
    slug: "accessories",
    allLabel: "All Accessories",
  },
  {
    id: "spare-parts",
    label: "Spare Parts",
    slug: "spare-parts",
    allLabel: "All Spare Parts",
  },
] as const;

export function buildCategoryGroups(categories: CategoryNode[]): CategoryGroup[] {
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));
  const used = new Set<string>();

  const groups: CategoryGroup[] = GROUP_BLUEPRINT.map((group) => {
    const groupCategories = group.slugs
      .map((slug) => {
        const category = categoryMap.get(slug);
        if (category) {
          used.add(slug);
        }
        return category;
      })
      .filter((category): category is CategoryNode => Boolean(category));

    return {
      id: group.id,
      label: group.label,
      categories: groupCategories,
    };
  }).filter((group) => group.categories.length > 0);

  const remaining = categories.filter(
    (category) => !used.has(category.slug) && !EXCLUDED_CATEGORY_SLUGS.has(category.slug)
  );
  if (remaining.length > 0) {
    groups.push({
      id: "more",
      label: "More Categories",
      categories: remaining,
    });
  }

  return groups.slice(0, 4);
}

export function buildMobileCategorySections(
  categories: CategoryNode[]
): MobileCategorySection[] {
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));
  const used = new Set<string>();

  const sections = MOBILE_SECTION_BLUEPRINT.flatMap((section) => {
    const category = categoryMap.get(section.slug);
    if (!category) return [];

    used.add(section.slug);

    return [
      {
        id: section.id,
        label: section.label,
        category,
        allLabel: section.allLabel,
      },
    ];
  });

  const remainingSections = categories
    .filter((category) => !used.has(category.slug) && !EXCLUDED_CATEGORY_SLUGS.has(category.slug))
    .map((category) => ({
      id: category.slug,
      label: category.name,
      category,
      allLabel: `All ${category.name}`,
    }));

  return [...sections, ...remainingSections];
}
