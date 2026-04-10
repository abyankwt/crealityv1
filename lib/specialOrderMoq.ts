export const SPECIAL_ORDER_MOQ = 12;

// Category slugs that require MOQ enforcement.
// Applies to: Materials, Accessories & Tools, Spare Parts.
// Does NOT apply to: Printers, Scanners, or other top-level product categories.
export const MOQ_CATEGORY_SLUGS = new Set([
  // Materials — Filaments
  "pla-filaments", "abs-filaments", "tpu-filaments",
  "silk-filaments", "carbon-filaments",
  // Materials — Resins
  "rigid-resin", "8k-resin", "fastresin", "water-washable-resin",
  "abs-resin", "pla-based-resin", "odor-resin",
  "dental-resin", "high-temperature-resin",
  // Accessories & Tools
  "tools", "wifi-upgrade-kits", "screen-kit",
  "auto-leveling", "silent-motherboard", "printer-enclosure",
  // Spare Parts — FDM
  "extruder-kit", "filament-sensor", "nozzle", "bed", "hotend", "hotbed",
  "bearing", "motors", "power-supply-fdm", "gears", "belt-cable-tubes",
  "fan", "other-kits",
  // Spare Parts — Resin
  "resin-release-film", "protective-cover", "resin-vat-platform-kits",
  "print-screen", "power-supply-sla", "motherboard-sla",
  "cables-wires", "fans-sla", "toolkits",
]);

export function requiresMoq(categorySlugs: string[]): boolean {
  return categorySlugs.some((slug) => MOQ_CATEGORY_SLUGS.has(slug));
}
