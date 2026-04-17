import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import {
  buildNavigation,
  buildNavigationFromMenu,
  type PromotionMenuItem,
} from "@/config/navigation";
import { getCategoryTree } from "@/lib/categories";
import { fetchSeasonalCampaign } from "@/lib/creality-cms";
import { getMaterialsNavigation } from "@/lib/materials";
import { getMenu } from "@/lib/menu-api";
import Navbar from "./Navbar";

const getCachedNavData = unstable_cache(
  async () => {
    const [menuItems, seasonalCampaign] = await Promise.all([
      getMenu(),
      fetchSeasonalCampaign(),
    ]);
    return { menuItems, seasonalCampaign };
  },
  ["navbar-data"],
  { revalidate: 3600 }
);

async function NavbarData() {
  const [categories, materialsGroups, { menuItems, seasonalCampaign }] =
    await Promise.all([
      getCategoryTree(),
      getMaterialsNavigation(),
      getCachedNavData(),
    ]);

  const seasonalPromotions: PromotionMenuItem[] =
    seasonalCampaign?.enabled && seasonalCampaign.slug && seasonalCampaign.nav_label
      ? [
          {
            id: `season-${seasonalCampaign.slug}`,
            label: seasonalCampaign.nav_label,
            href: `/season/${seasonalCampaign.slug}`,
            startDate: "2000-01-01",
            endDate: "2099-12-31",
          },
        ]
      : [];

  const navigation =
    menuItems.length > 0
      ? buildNavigationFromMenu({
          menuItems,
          hasPreOrders: true,
          promotions: seasonalPromotions,
          now: new Date(),
        })
      : buildNavigation({
          hasPreOrders: true,
          promotions: seasonalPromotions,
          now: new Date(),
        });

  return (
    <Navbar
      categories={categories}
      materialsGroups={materialsGroups}
      navigation={navigation}
    />
  );
}

function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 h-14 sm:h-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-full flex items-center justify-between">
        <div className="h-7 w-28 animate-pulse rounded bg-gray-100" />
        <div className="hidden sm:flex gap-6">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-4 w-16 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
        <div className="flex gap-3 items-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>
    </header>
  );
}

export default function NavbarServer() {
  return (
    <Suspense fallback={<NavbarSkeleton />}>
      <NavbarData />
    </Suspense>
  );
}
