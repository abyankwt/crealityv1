import "server-only";

import {
  MATERIALS_NAVIGATION,
  type MaterialsGroupConfig,
  type MaterialsGroupId,
  type MaterialsNavigationLink,
} from "@/config/materials-navigation";

export type MaterialsMenuLink = MaterialsNavigationLink & {
  id: string;
};

export type MaterialsMenuGroup = {
  id: MaterialsGroupId;
  label: "Filament" | "Resin";
  links: MaterialsMenuLink[];
};

type MaterialsNavigationOptions = {
  cacheMode?: "default" | "no-store";
  revalidate?: number;
};

function buildMaterialsNavigation(
  groups: MaterialsGroupConfig[]
): MaterialsMenuGroup[] {
  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    links: group.links.map((link) => ({
      ...link,
      id: `${group.id}-${link.slug}`,
    })),
  }));
}

const STATIC_MATERIALS_NAVIGATION = buildMaterialsNavigation(MATERIALS_NAVIGATION);

export async function getMaterialsNavigation(
  _options: MaterialsNavigationOptions = {}
): Promise<MaterialsMenuGroup[]> {
  return STATIC_MATERIALS_NAVIGATION;
}

export async function getMaterialCategoryBySlug(
  slug: string,
  options: MaterialsNavigationOptions = {}
) {
  const groups = await getMaterialsNavigation(options);
  return findMaterialEntryBySlug(groups, slug);
}

export function findMaterialEntryBySlug(
  groups: MaterialsMenuGroup[],
  slug: string
) {
  for (const group of groups) {
    const category = group.links.find((link) => link.slug === slug);

    if (category) {
      return {
        category,
        group,
      };
    }
  }

  return null;
}
