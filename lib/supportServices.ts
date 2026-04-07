export type SupportService = {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  slug: string;
};

export type SupportServiceSlugGroup = {
  primarySlug: string;
  fallbackSlugs?: string[];
};

export const SUPPORT_SERVICE_SLUG_GROUPS: SupportServiceSlugGroup[] = [
  {
    primarySlug: "home-service",
    fallbackSlugs: ["home-service-2"],
  },
  {
    primarySlug: "check-up",
    fallbackSlugs: ["printing-service"],
  },
  {
    primarySlug: "maintenance-service",
    fallbackSlugs: ["maintenance-service-2", "out-of-warranty-service", "out-of-creality"],
  },
];
