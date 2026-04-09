export type SparePartLink = {
  id: string;
  label: string;
  slug: string;
  wooSlug: string;
  href: string;
  groupId: string;
  groupLabel: string;
};

export type SparePartsGroup = {
  id: string;
  label: string;
  items: SparePartLink[];
};

export const SPARE_PARTS_CATEGORY_HREF = "/category/spare-parts";

function toUrlSlug(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildGroup(
  id: string,
  label: string,
  items: Array<{ label: string; wooSlug: string }>
): SparePartsGroup {
  return {
    id,
    label,
    items: items.map(({ label: itemLabel, wooSlug }) => {
      const slug = toUrlSlug(itemLabel);

      return {
        id: `${id}-${slug}`,
        label: itemLabel,
        slug,
        wooSlug,
        href: `/spare-parts/${slug}`,
        groupId: id,
        groupLabel: label,
      };
    }),
  };
}

export const SPARE_PARTS_GROUPS: SparePartsGroup[] = [
  buildGroup("fdm-printers", "FDM Printers", [
    { label: "Extruder Kit",        wooSlug: "extruderkit" },
    { label: "Filament Sensor",     wooSlug: "filament-sensor" },
    { label: "Nozzle",              wooSlug: "nozzle" },
    { label: "Bed",                 wooSlug: "bed" },
    { label: "Hotend",              wooSlug: "hotend" },
    { label: "HotBed",              wooSlug: "hotbid" },
    { label: "Bearing",             wooSlug: "bearing" },
    { label: "Motors",              wooSlug: "motors" },
    { label: "Power Supply - FDM",  wooSlug: "power-supply-fdm" },
    { label: "Gears",               wooSlug: "gears" },
    { label: "Belt - Cable - Tubes", wooSlug: "belt-cable-tubes" },
    { label: "Fan",                 wooSlug: "fan" },
    { label: "Other Kits",          wooSlug: "otherkits" },
  ]),
  buildGroup("resin-printers", "Resin Printers", [
    { label: "Resin Release Film",        wooSlug: "releasefilm" },
    { label: "Protective Cover",          wooSlug: "protective_cover" },
    { label: "Resin Vat & Platform Kits", wooSlug: "resin-vat-platform-kit" },
    { label: "Print Screen",              wooSlug: "print_screen" },
    { label: "Power Supply - SLA",        wooSlug: "power-supply-sla" },
    { label: "Motherboard - SLA",         wooSlug: "motherboard-sla" },
    { label: "Cables & Wires",            wooSlug: "cables-wires" },
    { label: "Fans - SLA",                wooSlug: "fans-sla" },
    { label: "ToolKits",                  wooSlug: "toolkits" },
  ]),
];

export const SPARE_PARTS_LINKS = SPARE_PARTS_GROUPS.flatMap((group) => group.items);

export function getSparePartBySlug(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();

  return SPARE_PARTS_LINKS.find((item) => item.slug === normalizedSlug) ?? null;
}
