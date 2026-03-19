"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  Apple,
  ChevronDown,
  Download,
  Monitor,
  ScanLine,
  Sparkles,
  Terminal,
} from "lucide-react";

type OSKey = "windows" | "macosApple" | "macosIntel" | "linux";
type AccordionKey = "updates" | "olderVersions";

type ReleaseFile = {
  version: string;
  fileName: string;
  releaseDate: string;
  url: string;
};

type SoftwareDownload = {
  current: ReleaseFile;
  updates: string[];
  olderVersions: ReleaseFile[];
};

type SoftwareProduct = {
  id: string;
  title: string;
  logo: string;
  description: string;
  downloads: Record<OSKey, SoftwareDownload>;
};

const OS_META: Record<
  OSKey,
  {
    label: string;
    icon: typeof Monitor;
  }
> = {
  windows: {
    label: "Windows",
    icon: Monitor,
  },
  macosApple: {
    label: "macOS (Apple)",
    icon: Apple,
  },
  macosIntel: {
    label: "macOS (Intel)",
    icon: Apple,
  },
  linux: {
    label: "Linux",
    icon: Terminal,
  },
};

const SOFTWARE_PRODUCTS: SoftwareProduct[] = [
  {
    id: "creality-print",
    title: "Creality Print",
    logo: "CP",
    description:
      "Advanced slicing, printer profile management, and project prep for FDM workflows across the Creality ecosystem.",
    downloads: {
      windows: {
        current: {
          version: "6.0.2",
          fileName: "Creality_Print_6.0.2_Windows.exe",
          releaseDate: "2026-03-10",
          url: "#",
        },
        updates: [
          "Added tuned high-speed profiles for K1 and Ender series printers.",
          "Improved tree support generation and seam hiding behavior.",
          "Refined project sync for multi-printer production environments.",
        ],
        olderVersions: [
          {
            version: "5.9.8",
            fileName: "Creality_Print_5.9.8_Windows.exe",
            releaseDate: "2026-01-22",
            url: "#",
          },
          {
            version: "5.8.4",
            fileName: "Creality_Print_5.8.4_Windows.exe",
            releaseDate: "2025-12-05",
            url: "#",
          },
        ],
      },
      macosApple: {
        current: {
          version: "6.0.2",
          fileName: "Creality_Print_6.0.2_macOS_Apple.dmg",
          releaseDate: "2026-03-10",
          url: "#",
        },
        updates: [
          "Native Apple Silicon build with faster slicing previews.",
          "Resolved viewport rendering artifacts on M-series GPUs.",
          "Improved crash recovery for large assemblies.",
        ],
        olderVersions: [
          {
            version: "5.9.8",
            fileName: "Creality_Print_5.9.8_macOS_Apple.dmg",
            releaseDate: "2026-01-22",
            url: "#",
          },
        ],
      },
      macosIntel: {
        current: {
          version: "6.0.2",
          fileName: "Creality_Print_6.0.2_macOS_Intel.dmg",
          releaseDate: "2026-03-10",
          url: "#",
        },
        updates: [
          "Optimized legacy macOS performance for Intel machines.",
          "Fixed project export issues affecting older MacBook hardware.",
        ],
        olderVersions: [
          {
            version: "5.9.8",
            fileName: "Creality_Print_5.9.8_macOS_Intel.dmg",
            releaseDate: "2026-01-22",
            url: "#",
          },
        ],
      },
      linux: {
        current: {
          version: "6.0.2",
          fileName: "Creality_Print_6.0.2_Linux.AppImage",
          releaseDate: "2026-03-10",
          url: "#",
        },
        updates: [
          "Updated AppImage runtime dependencies for wider distro compatibility.",
          "Improved printer discovery under Wayland sessions.",
        ],
        olderVersions: [
          {
            version: "5.9.8",
            fileName: "Creality_Print_5.9.8_Linux.AppImage",
            releaseDate: "2026-01-22",
            url: "#",
          },
        ],
      },
    },
  },
  {
    id: "halot-box",
    title: "HALOT BOX",
    logo: "HB",
    description:
      "Resin slicing software focused on print preparation, exposure tuning, and precise support control for HALOT printers.",
    downloads: {
      windows: {
        current: {
          version: "4.2.0",
          fileName: "HALOT_BOX_4.2.0_Windows.exe",
          releaseDate: "2026-02-18",
          url: "#",
        },
        updates: [
          "New support strength presets for engineering resin workflows.",
          "Refined anti-aliasing controls for higher surface quality.",
          "Faster slicing for dense miniature batches.",
        ],
        olderVersions: [
          {
            version: "4.1.3",
            fileName: "HALOT_BOX_4.1.3_Windows.exe",
            releaseDate: "2025-11-30",
            url: "#",
          },
        ],
      },
      macosApple: {
        current: {
          version: "4.2.0",
          fileName: "HALOT_BOX_4.2.0_macOS_Apple.dmg",
          releaseDate: "2026-02-18",
          url: "#",
        },
        updates: [
          "Reduced memory spikes during large resin scene imports.",
          "Improved support-editing responsiveness on M-series devices.",
        ],
        olderVersions: [
          {
            version: "4.1.3",
            fileName: "HALOT_BOX_4.1.3_macOS_Apple.dmg",
            releaseDate: "2025-11-30",
            url: "#",
          },
        ],
      },
      macosIntel: {
        current: {
          version: "4.2.0",
          fileName: "HALOT_BOX_4.2.0_macOS_Intel.dmg",
          releaseDate: "2026-02-18",
          url: "#",
        },
        updates: [
          "Stability improvements for Intel-based macOS releases.",
          "Fixed export issues affecting some older resin profiles.",
        ],
        olderVersions: [
          {
            version: "4.1.3",
            fileName: "HALOT_BOX_4.1.3_macOS_Intel.dmg",
            releaseDate: "2025-11-30",
            url: "#",
          },
        ],
      },
      linux: {
        current: {
          version: "4.2.0",
          fileName: "HALOT_BOX_4.2.0_Linux.AppImage",
          releaseDate: "2026-02-18",
          url: "#",
        },
        updates: [
          "Initial Linux production release with validated HALOT profiles.",
          "Improved scene import for complex resin supports.",
        ],
        olderVersions: [
          {
            version: "4.1.0",
            fileName: "HALOT_BOX_4.1.0_Linux.AppImage",
            releaseDate: "2025-10-14",
            url: "#",
          },
        ],
      },
    },
  },
  {
    id: "creality-scan",
    title: "Creality Scan",
    logo: "CS",
    description:
      "Point-cloud processing and scan alignment software for capturing, refining, and exporting 3D scan data.",
    downloads: {
      windows: {
        current: {
          version: "3.5.1",
          fileName: "Creality_Scan_3.5.1_Windows.exe",
          releaseDate: "2026-03-05",
          url: "#",
        },
        updates: [
          "Improved scan alignment for reflective surfaces.",
          "Added faster mesh cleanup presets for reverse engineering.",
        ],
        olderVersions: [
          {
            version: "3.4.6",
            fileName: "Creality_Scan_3.4.6_Windows.exe",
            releaseDate: "2025-12-18",
            url: "#",
          },
        ],
      },
      macosApple: {
        current: {
          version: "3.5.1",
          fileName: "Creality_Scan_3.5.1_macOS_Apple.dmg",
          releaseDate: "2026-03-05",
          url: "#",
        },
        updates: [
          "Faster real-time preview rendering on Apple Silicon hardware.",
          "Improved OBJ and STL export consistency.",
        ],
        olderVersions: [
          {
            version: "3.4.6",
            fileName: "Creality_Scan_3.4.6_macOS_Apple.dmg",
            releaseDate: "2025-12-18",
            url: "#",
          },
        ],
      },
      macosIntel: {
        current: {
          version: "3.5.1",
          fileName: "Creality_Scan_3.5.1_macOS_Intel.dmg",
          releaseDate: "2026-03-05",
          url: "#",
        },
        updates: [
          "Improved frame stitching for long scanning sessions.",
          "Fixed device detection issues for select Intel Mac builds.",
        ],
        olderVersions: [
          {
            version: "3.4.6",
            fileName: "Creality_Scan_3.4.6_macOS_Intel.dmg",
            releaseDate: "2025-12-18",
            url: "#",
          },
        ],
      },
      linux: {
        current: {
          version: "3.5.1",
          fileName: "Creality_Scan_3.5.1_Linux.AppImage",
          releaseDate: "2026-03-05",
          url: "#",
        },
        updates: [
          "Expanded Linux support for USB scanner devices.",
          "Reduced export time for large scan projects.",
        ],
        olderVersions: [
          {
            version: "3.4.6",
            fileName: "Creality_Scan_3.4.6_Linux.AppImage",
            releaseDate: "2025-12-18",
            url: "#",
          },
        ],
      },
    },
  },
  {
    id: "falcon-design-space",
    title: "Falcon Design Space",
    logo: "FD",
    description:
      "Design and job preparation software for Falcon laser systems with layout tools, path settings, and material presets.",
    downloads: {
      windows: {
        current: {
          version: "2.9.4",
          fileName: "Falcon_Design_Space_2.9.4_Windows.exe",
          releaseDate: "2026-01-29",
          url: "#",
        },
        updates: [
          "Expanded material library for acrylic, plywood, and leather jobs.",
          "Improved path ordering for cleaner engraving sequences.",
        ],
        olderVersions: [
          {
            version: "2.8.9",
            fileName: "Falcon_Design_Space_2.8.9_Windows.exe",
            releaseDate: "2025-11-11",
            url: "#",
          },
        ],
      },
      macosApple: {
        current: {
          version: "2.9.4",
          fileName: "Falcon_Design_Space_2.9.4_macOS_Apple.dmg",
          releaseDate: "2026-01-29",
          url: "#",
        },
        updates: [
          "Improved Apple Silicon preview performance for larger jobs.",
          "Fixed text tool baseline alignment issues.",
        ],
        olderVersions: [
          {
            version: "2.8.9",
            fileName: "Falcon_Design_Space_2.8.9_macOS_Apple.dmg",
            releaseDate: "2025-11-11",
            url: "#",
          },
        ],
      },
      macosIntel: {
        current: {
          version: "2.9.4",
          fileName: "Falcon_Design_Space_2.9.4_macOS_Intel.dmg",
          releaseDate: "2026-01-29",
          url: "#",
        },
        updates: [
          "Improved project import stability on Intel-based Macs.",
          "Refined raster output for detailed engraving files.",
        ],
        olderVersions: [
          {
            version: "2.8.9",
            fileName: "Falcon_Design_Space_2.8.9_macOS_Intel.dmg",
            releaseDate: "2025-11-11",
            url: "#",
          },
        ],
      },
      linux: {
        current: {
          version: "2.9.4",
          fileName: "Falcon_Design_Space_2.9.4_Linux.AppImage",
          releaseDate: "2026-01-29",
          url: "#",
        },
        updates: [
          "Improved Linux printing pipeline for Falcon controller jobs.",
          "Reduced launch time for larger asset libraries.",
        ],
        olderVersions: [
          {
            version: "2.8.9",
            fileName: "Falcon_Design_Space_2.8.9_Linux.AppImage",
            releaseDate: "2025-11-11",
            url: "#",
          },
        ],
      },
    },
  },
];

function SoftwareAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="border-t border-gray-100 px-4 py-4">{children}</div> : null}
    </div>
  );
}

export default function SoftwareCenter() {
  const [activeSoftware, setActiveSoftware] = useState<string>(SOFTWARE_PRODUCTS[0].id);
  const [activeOS, setActiveOS] = useState<OSKey>("windows");
  const [openSections, setOpenSections] = useState<Record<AccordionKey, boolean>>({
    updates: true,
    olderVersions: false,
  });

  const software =
    SOFTWARE_PRODUCTS.find((item) => item.id === activeSoftware) ?? SOFTWARE_PRODUCTS[0];
  const activeDownload = software.downloads[activeOS];

  const toggleSection = (section: AccordionKey) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
          {SOFTWARE_PRODUCTS.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                setActiveSoftware(product.id);
                setActiveOS("windows");
              }}
              className={`min-w-fit whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
                activeSoftware === product.id
                  ? "bg-black text-white shadow-sm"
                  : "bg-white text-gray-500 hover:text-gray-900"
              }`}
            >
              {product.title}
            </button>
          ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-black text-base font-semibold text-white sm:h-16 sm:w-16 sm:text-lg">
              {software.logo}
              </div>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                  {software.title}
                </h2>
                <p className="text-sm leading-relaxed text-gray-500">
                  {software.description}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
            {(Object.entries(OS_META) as [OSKey, (typeof OS_META)[OSKey]][]).map(
              ([osKey, meta]) => {
                const Icon = meta.icon;

                return (
                  <button
                    key={osKey}
                    type="button"
                    onClick={() => setActiveOS(osKey)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      activeOS === osKey
                        ? "border border-black bg-black text-white shadow-sm"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {meta.label}
                  </button>
                );
              }
            )}
            </div>

            <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Download
                  </p>
                  <h3 className="break-words text-base font-semibold text-gray-900">
                    {activeDownload.current.fileName}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">
                    Released on {activeDownload.current.releaseDate}
                  </p>
                </div>
                <a
                  href={activeDownload.current.url}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Download v{activeDownload.current.version}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-semibold text-gray-900">Platform Summary</p>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                Select a software suite, switch operating systems, and download the
                latest production-ready build from a single structured panel.
              </p>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Current target:{" "}
                <span className="font-medium text-gray-900">{OS_META[activeOS].label}</span>
              </div>
            </div>
          </div>

          <SoftwareAccordion
            title="Updates"
            open={openSections.updates}
            onToggle={() => toggleSection("updates")}
          >
            <ul className="space-y-3 text-sm text-gray-600">
              {activeDownload.updates.map((update) => (
                <li key={update} className="flex gap-3">
                  <ScanLine className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span>{update}</span>
                </li>
              ))}
            </ul>
          </SoftwareAccordion>

          <SoftwareAccordion
            title="Older Versions"
            open={openSections.olderVersions}
            onToggle={() => toggleSection("olderVersions")}
          >
            <div className="space-y-3">
              {activeDownload.olderVersions.map((release) => (
                <div
                  key={`${release.fileName}-${release.version}`}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{release.fileName}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      v{release.version} - Released on {release.releaseDate}
                    </p>
                  </div>
                  <a
                    href={release.url}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </SoftwareAccordion>
        </section>
      </div>
    </div>
  );
}
