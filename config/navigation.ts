export type PromotionMenuItem = {
  id: string;
  label: string;
  href: string;
  startDate: string;
  endDate: string;
};

export type NavigationItemKind =
  | "mega"
  | "materials"
  | "link"
  | "promotion"
  | "account";

export type NavigationItem = {
  id: string;
  kind: NavigationItemKind;
  label: string;
  href: string;
};

export type NavigationLink = {
  label: string;
  href: string;
};

export type MenuNavigationItem = {
  id: number;
  title: string;
  url: string;
  parent?: number;
};

export const PRE_ORDERS_SECTION_ID = "pre-orders";

type BuildNavigationOptions = {
  hasPreOrders: boolean;
  promotions?: PromotionMenuItem[];
  now?: Date;
  timeZone?: string;
};

const ALL_PRODUCTS_ITEM: NavigationItem = {
  id: "all-products",
  kind: "mega",
  label: "All Products",
  href: "/store",
};

const PRE_ORDERS_ITEM: NavigationItem = {
  id: "pre-orders",
  kind: "link",
  label: "Pre-orders",
  href: "/pre-orders",
};

const MATERIALS_ITEM: NavigationItem = {
  id: "materials",
  kind: "materials",
  label: "Materials",
  href: "/materials",
};

const USED_3D_PRINTERS_ITEM: NavigationItem = {
  id: "used-3d-printers",
  kind: "link",
  label: "Used 3D Printers",
  href: "/used-3d-printers",
};

const STATIC_NAV_ITEMS: NavigationItem[] = [
  {
    id: "printing-service",
    kind: "link",
    label: "Printing Service",
    href: "/printing-service",
  },
  {
    id: "downloads",
    kind: "link",
    label: "Downloads",
    href: "/downloads",
  },
  {
    id: "support",
    kind: "link",
    label: "Support",
    href: "/support",
  },
  {
    id: "account",
    kind: "account",
    label: "Account",
    href: "/account",
  },
];

// Seasonal promotions should be supplied by the backend when available.
export const DEFAULT_PROMOTIONAL_NAV_ITEMS: PromotionMenuItem[] = [];

export const ALL_PRODUCTS_CATEGORY_LINKS: NavigationLink[] = [
  { label: "K Series", href: "/category/k-series" },
  { label: "PLA Filaments", href: "/category/pla-filaments" },
  { label: "Accessories", href: "/category/accessories" },
  { label: "3D Printers", href: "/category/3d-printers" },
  { label: "3D Scanners", href: "/category/3d-scanners" },


  { label: "Laser Milling Machines", href: "/category/laser-milling" },
  { label: "Spare Parts", href: "/category/spare-parts" },
];

export const ACCOUNT_NAV_LINKS: NavigationLink[] = [
  { label: "Dashboard", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Addresses", href: "/account/addresses" },
];

function getDateKey(now: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isPromotionActive(
  promotion: PromotionMenuItem,
  now = new Date(),
  timeZone = "Asia/Kuwait"
) {
  const currentDate = getDateKey(now, timeZone);

  return currentDate >= promotion.startDate && currentDate <= promotion.endDate;
}

export function getActivePromotions(
  promotions: PromotionMenuItem[] = DEFAULT_PROMOTIONAL_NAV_ITEMS,
  now = new Date(),
  timeZone = "Asia/Kuwait"
): NavigationItem[] {
  return promotions
    .filter((promotion) => isPromotionActive(promotion, now, timeZone))
    .map((promotion) => ({
      id: promotion.id,
      kind: "promotion" as const,
      label: promotion.label,
      href: promotion.href,
    }));
}

export function buildNavigation({
  hasPreOrders,
  promotions = DEFAULT_PROMOTIONAL_NAV_ITEMS,
  now = new Date(),
  timeZone = "Asia/Kuwait",
}: BuildNavigationOptions): NavigationItem[] {
  return [
    ALL_PRODUCTS_ITEM,
    MATERIALS_ITEM,
    ...(hasPreOrders ? [PRE_ORDERS_ITEM] : []),
    USED_3D_PRINTERS_ITEM,
    ...getActivePromotions(promotions, now, timeZone),
    ...STATIC_NAV_ITEMS,
  ];
}

function normalizeMenuHref(href: string) {
  const trimmed = href.trim();

  if (!trimmed) {
    return "/store";
  }

  if (trimmed === "/products") {
    return "/store";
  }

  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }

  return trimmed;
}

function resolveNavigationId(item: Pick<MenuNavigationItem, "id" | "title" | "url">) {
  const href = normalizeMenuHref(item.url).toLowerCase();
  const title = item.title.trim().toLowerCase();

  if (href === "/store" || title === "all products") {
    return "all-products";
  }

  if (href === "/pre-orders" || title === "pre-orders") {
    return "pre-orders";
  }

  if (href === "/materials" || title === "materials") {
    return "materials";
  }

  if (href === "/used-3d-printers" || title === "used 3d printers") {
    return "used-3d-printers";
  }

  if (
    href === "/printing-service" ||
    href === "/printing-services" ||
    title === "printing service"
  ) {
    return "printing-service";
  }

  if (href === "/downloads" || title === "downloads") {
    return "downloads";
  }

  if (href === "/support" || title === "support") {
    return "support";
  }

  return `menu-${item.id}`;
}

export function buildNavigationFromMenu({
  menuItems,
  hasPreOrders,
  promotions = DEFAULT_PROMOTIONAL_NAV_ITEMS,
  now = new Date(),
  timeZone = "Asia/Kuwait",
}: BuildNavigationOptions & {
  menuItems: MenuNavigationItem[];
}): NavigationItem[] {
  const menuNavigation = menuItems
    .filter((item) => !item.parent)
    .map<NavigationItem | null>((item) => {
      const href = normalizeMenuHref(item.url);
      const id = resolveNavigationId(item);

      if (id === "pre-orders" && !hasPreOrders) {
        return null;
      }

      if (href === "/account" || item.title.trim().toLowerCase() === "account") {
        return null;
      }

      return {
        id,
        kind:
          id === "all-products"
            ? "mega"
            : id === "materials"
            ? "materials"
            : "link",
        label: item.title,
        href,
      };
    })
    .filter((item): item is NavigationItem => Boolean(item));

  if (menuNavigation.length === 0) {
    return buildNavigation({
      hasPreOrders,
      promotions,
      now,
      timeZone,
    });
  }

  const withPromotions = [
    ...menuNavigation,
    ...getActivePromotions(promotions, now, timeZone).filter(
      (promotion) => !menuNavigation.some((item) => item.id === promotion.id)
    ),
  ];

  if (!withPromotions.some((item) => item.id === MATERIALS_ITEM.id)) {
    const allProductsIndex = withPromotions.findIndex(
      (item) => item.id === ALL_PRODUCTS_ITEM.id
    );

    if (allProductsIndex >= 0) {
      withPromotions.splice(allProductsIndex + 1, 0, MATERIALS_ITEM);
    } else {
      withPromotions.unshift(MATERIALS_ITEM);
    }
  }

  return [
    ...withPromotions,
    STATIC_NAV_ITEMS.find((item) => item.kind === "account") ?? {
      id: "account",
      kind: "account",
      label: "Account",
      href: "/account",
    },
  ];
}
