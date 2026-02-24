export type PopupType = "new-product" | "limited-offer" | "announcement";

export interface PopupConfig {
    /** Set to false to completely disable the popup site-wide */
    enabled: boolean;
    type: PopupType;
    title: string;
    description: string;
    /** Absolute path to an image in /public, or empty string to omit */
    image: string;
    ctaText: string;
    ctaLink: string;
    /** Delay in ms before the popup opens (default: 5000) */
    delay: number;
    /** How long (ms) to suppress the popup after dismissal (default: 24h) */
    dismissDuration: number;
}

export const POPUP_CONFIG: PopupConfig = {
    enabled: true,
    type: "new-product",
    title: "Meet the next-generation K1 lineup",
    description:
        "Faster printing, cleaner surfaces, and smarter controls. Now available in Kuwait.",
    image: "/images/printers.jpg",
    ctaText: "Explore Now",
    ctaLink: "/category/3d-printers",
    delay: 5000,
    dismissDuration: 24 * 60 * 60 * 1000, // 24 hours
};
