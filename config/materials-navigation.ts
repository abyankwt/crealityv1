export type MaterialsGroupId = "filament" | "resin";

export type MaterialsNavigationLink = {
  label: string;
  slug: string;
  href: `/materials/${string}`;
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
        label: "Silk Filaments",
        slug: "silk-filaments",
        href: "/materials/silk-filaments",
      },
      {
        label: "Carbon Filaments",
        slug: "carbon-filaments",
        href: "/materials/carbon-filaments",
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
        slug: "fast-resin",
        href: "/materials/fast-resin",
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
        slug: "low-odor-resin",
        href: "/materials/low-odor-resin",
      },
      {
        label: "Dental Resin",
        slug: "dental-resin",
        href: "/materials/dental-resin",
      },
      {
        label: "High Temperature Resin",
        slug: "high-temperature-resin",
        href: "/materials/high-temperature-resin",
      },
    ],
  },
];
