import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import Footer from "@/components/Footer";
import GlobalClientUI from "@/components/GlobalClientUI";
import Navbar from "@/components/navigation/Navbar";
import {
  buildNavigation,
  buildNavigationFromMenu,
  type PromotionMenuItem,
} from "@/config/navigation";
import { CartProvider } from "@/context/CartContext";
import { getCategoryTree } from "@/lib/categories";
import {
  fetchHomepagePopup,
  fetchSeasonalCampaign,
} from "@/lib/creality-cms";
import { getMaterialsNavigation } from "@/lib/materials";
import { getMenu } from "@/lib/menu-api";
import { hasPreOrderProducts } from "@/lib/preOrders";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Creality Kuwait",
  description:
    "Official Creality 3D printer store in Kuwait. FDM, resin printers, materials, and spare parts.",
};

const hydrationAttributeCleanupScript = `
  (() => {
    const attrs = ["bis_skin_checked", "fdprocessedid"];
    const selector = attrs.map((attr) => "[" + attr + "]").join(",");

    const stripAttributes = (element) => {
      if (!(element instanceof Element)) {
        return;
      }

      for (const attr of attrs) {
        if (element.hasAttribute(attr)) {
          element.removeAttribute(attr);
        }
      }
    };

    const stripTree = (root) => {
      stripAttributes(root);

      if (!(root instanceof Element)) {
        return;
      }

      root.querySelectorAll(selector).forEach(stripAttributes);
    };

    stripTree(document.documentElement);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          stripAttributes(mutation.target);
        }

        if (mutation.type === "childList") {
          mutation.addedNodes.forEach(stripTree);
        }
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: attrs,
    });

    window.addEventListener(
      "load",
      () => {
        stripTree(document.documentElement);
        observer.disconnect();
      },
      { once: true }
    );
  })();
`;

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [
    categories,
    materialsGroups,
    hasPreOrders,
    menuItems,
    popupData,
    seasonalCampaign,
  ] = await Promise.all([
    getCategoryTree(),
    getMaterialsNavigation(),
    hasPreOrderProducts(),
    getMenu(),
    fetchHomepagePopup(),
    fetchSeasonalCampaign(),
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
          hasPreOrders,
          promotions: seasonalPromotions,
          now: new Date(),
        })
      : buildNavigation({
          hasPreOrders,
          promotions: seasonalPromotions,
          now: new Date(),
        });

  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-gray-900" suppressHydrationWarning>
        <Script
          id="hydration-attribute-cleanup"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: hydrationAttributeCleanupScript }}
        />
        <CartProvider>
          <Navbar
            categories={categories}
            materialsGroups={materialsGroups}
            navigation={navigation}
          />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <GlobalClientUI popupData={popupData} />
        </CartProvider>
      </body>
    </html>
  );
}
