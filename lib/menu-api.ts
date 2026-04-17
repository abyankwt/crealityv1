export type WordPressMenuItem = {
  id: number;
  title: string;
  url: string;
  parent?: number;
};

const MENU_REVALIDATE_SECONDS = 3600;

const FALLBACK_MENU: WordPressMenuItem[] = [
  { id: 1, title: "All Products", url: "/products", parent: 0 },
  { id: 2, title: "Pre-orders", url: "/pre-orders", parent: 0 },
  { id: 3, title: "Used 3D Printers", url: "/used-3d-printers", parent: 0 },
  { id: 4, title: "Printing Service", url: "/printing-service", parent: 0 },
  { id: 5, title: "Downloads", url: "/downloads", parent: 0 },
  { id: 6, title: "Support", url: "/support", parent: 0 },
];

const getMenuBaseUrl = () =>
  process.env.WC_BASE_URL?.trim() ||
  process.env.WORDPRESS_URL?.trim() ||
  process.env.NEXT_PUBLIC_WC_BASE_URL?.trim() ||
  "";

export async function getMenu(): Promise<WordPressMenuItem[]> {
  const baseUrl = getMenuBaseUrl().replace(/\/$/, "");

  if (!baseUrl) {
    console.error("Menu fetch error:", new Error("Missing WordPress base URL"));
    return FALLBACK_MENU;
  }

  try {
    const res = await fetch(`${baseUrl}/wp-json/custom/v1/menu`, {
      next: { revalidate: MENU_REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch menu (${res.status})`);
    }

    const menu = (await res.json()) as WordPressMenuItem[];

    if (!Array.isArray(menu) || menu.length === 0) {
      return FALLBACK_MENU;
    }

    return menu;
  } catch (error) {
    console.error("Menu fetch error:", error);
    return FALLBACK_MENU;
  }
}
