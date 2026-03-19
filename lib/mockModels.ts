import { formatKWD } from "@/lib/formatCurrency";

export type MarketplaceModel = {
  id: string;
  title: string;
  creator: string;
  category: string;
  description: string;
  image: string;
  likes: number;
  downloads: number;
  price: number | null;
  createdAt: string;
  tags: string[];
};

export const MARKETPLACE_MODELS: MarketplaceModel[] = [
  {
    id: "gear-organizer-v2",
    title: "Gear Organizer V2",
    creator: "Creality Lab",
    category: "Workshop",
    description: "A modular desk organizer built for tools, bits, and machine accessories.",
    image: "/images/printing-hero.jpg",
    likes: 482,
    downloads: 3140,
    price: null,
    createdAt: "2026-03-10",
    tags: ["Organizer", "Workshop", "Modular", "FDM"],
  },
  {
    id: "miniature-display-plinth",
    title: "Miniature Display Plinth",
    creator: "LayerWorks",
    category: "Display",
    description: "A clean presentation stand designed for resin miniatures and product shots.",
    image: "/images/printing-hero.jpg",
    likes: 231,
    downloads: 1286,
    price: 1.5,
    createdAt: "2026-03-16",
    tags: ["Display", "Resin", "Miniatures", "Desk"],
  },
  {
    id: "cable-clamp-kit",
    title: "Cable Clamp Kit",
    creator: "PrintForge",
    category: "Accessories",
    description: "Snap-fit cable clamps for workbenches, enclosures, and printer frames.",
    image: "/images/printing-hero.jpg",
    likes: 167,
    downloads: 904,
    price: null,
    createdAt: "2026-02-28",
    tags: ["Cable Management", "Printer Upgrade", "Utility"],
  },
  {
    id: "filament-spool-rack",
    title: "Filament Spool Rack",
    creator: "Maker Gulf",
    category: "Storage",
    description: "A wall-mounted rack system for organizing multiple filament spools.",
    image: "/images/printing-hero.jpg",
    likes: 395,
    downloads: 2217,
    price: 1.75,
    createdAt: "2026-03-12",
    tags: ["Storage", "Filament", "Wall Mount", "Workshop"],
  },
  {
    id: "phone-dock-pro",
    title: "Phone Dock Pro",
    creator: "Studio Mesh",
    category: "Desk Setup",
    description: "A weighted desktop dock with cable routing for phones and compact tablets.",
    image: "/images/printing-hero.jpg",
    likes: 614,
    downloads: 4088,
    price: null,
    createdAt: "2026-03-18",
    tags: ["Desk Setup", "Mobile", "Accessory", "Modern"],
  },
  {
    id: "hex-storage-bin-set",
    title: "Hex Storage Bin Set",
    creator: "Noura Prints",
    category: "Storage",
    description: "Stackable hex bins for screws, nozzles, and workshop consumables.",
    image: "/images/printing-hero.jpg",
    likes: 188,
    downloads: 1154,
    price: 1.2,
    createdAt: "2026-03-14",
    tags: ["Storage", "Bins", "Workshop", "Organization"],
  },
  {
    id: "camera-mount-arm",
    title: "Camera Mount Arm",
    creator: "Motion Layer",
    category: "Content Tools",
    description: "An adjustable arm for overhead timelapse and workbench camera setups.",
    image: "/images/printing-hero.jpg",
    likes: 273,
    downloads: 1672,
    price: 2.0,
    createdAt: "2026-03-17",
    tags: ["Camera", "Content", "Mount", "Studio"],
  },
  {
    id: "precision-parts-tray",
    title: "Precision Parts Tray",
    creator: "Creality Team",
    category: "Workshop",
    description: "A multi-compartment tray for screws, bearings, and assembly subcomponents.",
    image: "/images/printing-hero.jpg",
    likes: 149,
    downloads: 792,
    price: null,
    createdAt: "2026-03-01",
    tags: ["Tray", "Precision", "Hardware", "Assembly"],
  },
];

export function formatModelPrice(price: MarketplaceModel["price"]) {
  return price === null ? "Free" : formatKWD(price);
}

export function getMarketplaceModelById(id: string) {
  return MARKETPLACE_MODELS.find((model) => model.id === id);
}
