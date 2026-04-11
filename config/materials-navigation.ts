export type MaterialsGroupId = "filament" | "resin";

export type MaterialsNavigationLink = {
  label: string;
  slug: string;
  href: `/materials/${string}`;
  children?: MaterialsNavigationLink[];
};

export type MaterialsGroupConfig = {
  id: MaterialsGroupId;
  label: "Filament" | "Resin";
  links: MaterialsNavigationLink[];
};

export const MATERIALS_NAVIGATION: MaterialsGroupConfig[] = [
  {
    id: "filament",
    label: "Filament",
    links: [
      {
        label: "PLA Filaments",
        slug: "pla-filaments",
        href: "/materials/pla-filaments",
        children: [
          { label: "Hyper PLA", slug: "hyper-pla", href: "/materials/hyper-pla" },
          { label: "Matte PLA", slug: "matte-pla", href: "/materials/matte-pla" },
          { label: "PLA", slug: "pla", href: "/materials/pla" },
          { label: "PLA+", slug: "pla-plus", href: "/materials/pla-plus" },
        ],
      },
      {
        label: "ABS Filaments",
        slug: "abs-filaments",
        href: "/materials/abs-filaments",
      },
      {
        label: "TPU Filaments",
        slug: "tpu-filaments",
        href: "/materials/tpu-filaments",
      },
      {
        label: "Filament",
        slug: "filament",
        href: "/materials/filament",
        children: [
          { label: "Carbon Filaments", slug: "carbon-filaments", href: "/materials/carbon-filaments" },
          { label: "Nylon Filaments", slug: "nylon-filaments", href: "/materials/nylon-filaments" },
          { label: "Silk Filaments", slug: "silk-filaments", href: "/materials/silk-filaments" },
          { label: "Wood Filaments", slug: "wood-filaments", href: "/materials/wood-filaments" },
        ],
      },
    ],
  },
  {
    id: "resin",
    label: "Resin",
    links: [
      {
        label: "Rigid Resin",
        slug: "rigid-resin",
        href: "/materials/rigid-resin",
      },
      {
        label: "8K Resin",
        slug: "8k-resin",
        href: "/materials/8k-resin",
      },
      {
        label: "Fast Resin",
        slug: "fastresin",
        href: "/materials/fastresin",
      },
      {
        label: "Water Washable Resin",
        slug: "water-washable-resin",
        href: "/materials/water-washable-resin",
      },
      {
        label: "ABS Resin",
        slug: "abs-resin",
        href: "/materials/abs-resin",
      },
      {
        label: "PLA Based Resin",
        slug: "pla-based-resin",
        href: "/materials/pla-based-resin",
      },
      {
        label: "Low Odor Resin",
        slug: "odor-resin",
        href: "/materials/odor-resin",
      },
      {
        label: "Dental Resin",
        slug: "dental-resin",
        href: "/materials/dental-resin",
      },
      {
        label: "Jewelry Resin",
        slug: "jewelry-resin",
        href: "/materials/jewelry-resin",
      },
      {
        label: "High Temperature Resin",
        slug: "high-temperature-resin",
        href: "/materials/high-temperature-resin",
      },
    ],
  },
];
