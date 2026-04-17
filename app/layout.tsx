import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import Footer from "@/components/Footer";
import GlobalClientUI from "@/components/GlobalClientUI";
import NavbarServer from "@/components/navigation/NavbarServer";
import { CartProvider } from "@/context/CartContext";

export const revalidate = 3600;

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://creality.com.kw" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://creality.com.kw" />
      </head>
      <body className="bg-white text-gray-900" suppressHydrationWarning>
        <Script
          id="hydration-attribute-cleanup"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: hydrationAttributeCleanupScript }}
        />
        <CartProvider>
          <NavbarServer />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <GlobalClientUI />
        </CartProvider>
      </body>
    </html>
  );
}
