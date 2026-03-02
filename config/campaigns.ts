export type CampaignCTA = {
    text: string;
    link: string;
};

export type CampaignSlide = {
    label?: string;
    title: string;
    subtitle: string;
    primaryCTA: CampaignCTA;
    secondaryCTA?: CampaignCTA;
    backgroundImage: string;
    overlayOpacity?: number;
    textColor?: "light" | "dark";
    /** CSS object-position for the background image, e.g. "center top" */
    objectPosition?: string;
    /** Mobile-specific object-position (used below md breakpoint) */
    mobileObjectPosition?: string;
    isActive: boolean;
};

export const CAMPAIGN_SLIDES: CampaignSlide[] = [
    {
        label: "New",
        title: "SPARKX i7",
        subtitle: "Make Every Spark Outplay",
        primaryCTA: {
            text: "Explore Now",
            link: "/category/3d-printers",
        },
        secondaryCTA: {
            text: "Pre-order Now",
            link: "/category/3d-printers",
        },
        backgroundImage: "/images/printers.jpg",
        overlayOpacity: 0.05,
        objectPosition: "center center",
        mobileObjectPosition: "left center",
        isActive: true,
    },
    {
        label: "Featured",
        title: "K2 Series",
        subtitle: "The Ultimate Creative Powerhouses",
        primaryCTA: {
            text: "Learn More",
            link: "/category/3d-printers",
        },
        secondaryCTA: {
            text: "Buy Now",
            link: "/category/3d-printers",
        },
        backgroundImage: "/images/materials.jpg",
        overlayOpacity: 0.08,
        objectPosition: "center 20%",
        mobileObjectPosition: "center 15%",
        isActive: true,
    },
    {
        label: "New",
        title: "SpacePi X4L",
        subtitle: "The First Choice for Multi-Color Drying",
        primaryCTA: {
            text: "Buy Now",
            link: "/category/3d-printers",
        },
        secondaryCTA: {
            text: "Learn More",
            link: "/category/3d-printers",
        },
        backgroundImage: "/images/spareparts.jpg",
        overlayOpacity: 0.05,
        objectPosition: "center 30%",
        mobileObjectPosition: "center 20%",
        isActive: true,
    },
    {
        label: "Featured",
        title: "HALOT-SKY",
        subtitle: "Unlimited innovation drives resin printing future",
        primaryCTA: {
            text: "Explore Now",
            link: "/category/3d-printers",
        },
        secondaryCTA: {
            text: "Buy Now",
            link: "/category/3d-printers",
        },
        backgroundImage: "/images/materials.jpg",
        overlayOpacity: 0.05,
        objectPosition: "center 15%",
        mobileObjectPosition: "center 0%",
        isActive: true,
    },
];
