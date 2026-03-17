export type PromotionMenuItem = {
  id: string;
  label: string;
  href: string;
  startDate: string;
  endDate: string;
};

export type NavigationItemKind = "mega" | "link" | "promotion" | "account";

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
  href: `/#${PRE_ORDERS_SECTION_ID}`,
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

export const PROMOTIONAL_NAV_ITEMS: PromotionMenuItem[] = [
  {
    id: "ramadan-sale",
    label: "Ramadan Sale",
    href: "/store?promotion=ramadan-sale",
    startDate: "2026-02-20",
    endDate: "2026-03-30",
  },
  {
    id: "eid-sale",
    label: "Eid Sale",
    href: "/store?promotion=eid-sale",
    startDate: "2026-03-31",
    endDate: "2026-04-07",
  },
  {
    id: "kuwait-independence-day-sale",
    label: "Kuwait Independence Day Sale",
    href: "/store?promotion=kuwait-independence-day-sale",
    startDate: "2026-02-20",
    endDate: "2026-02-26",
  },
];

export const ALL_PRODUCTS_CATEGORY_LINKS: NavigationLink[] = [
  { label: "3D Printers", href: "/category/3d-printers" },
  { label: "3D Scanners", href: "/category/3d-scanners" },
  { label: "Accessories", href: "/category/accessories" },
  { label: "Materials", href: "/category/materials" },
  { label: "Washing and Curing", href: "/category/washing-curing" },
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
  promotions: PromotionMenuItem[] = PROMOTIONAL_NAV_ITEMS,
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
  promotions = PROMOTIONAL_NAV_ITEMS,
  now = new Date(),
  timeZone = "Asia/Kuwait",
}: BuildNavigationOptions): NavigationItem[] {
  return [
    ALL_PRODUCTS_ITEM,
    ...(hasPreOrders ? [PRE_ORDERS_ITEM] : []),
    ...getActivePromotions(promotions, now, timeZone),
    ...STATIC_NAV_ITEMS,
  ];
}
