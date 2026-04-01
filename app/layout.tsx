import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
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
import { getMenu } from "@/lib/menu-api";
import { hasPreOrderProducts } from "@/lib/preOrders";

export const metadata: Metadata = {
  title: "Creality Kuwait",
  description:
    "Official Creality 3D printer store in Kuwait. FDM, resin printers, materials, and spare parts.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [categories, hasPreOrders, menuItems] = await Promise.all([
    getCategoryTree(),
    hasPreOrderProducts(),
    getMenu(),
  ]);
  // Replace this with the WordPress seasonal menu payload when the endpoint is ready.
  const seasonalPromotions: PromotionMenuItem[] = [];
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
        <CartProvider>
          <Navbar categories={categories} navigation={navigation} />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <GlobalClientUI />
        </CartProvider>
      </body>
    </html>
  );
}
