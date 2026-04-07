"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import CrealityCloudCard from "@/components/CrealityCloudCard";
import { INQUIRY_EMAIL, SUPPORT_EMAIL } from "@/config/emails";
import { SOCIAL_LINKS, SocialLink } from "@/config/social-links";
import { ChevronDown } from "lucide-react";

/* ────────────────────────────────────────────────
   Branded SVG social icons — original brand colors
─────────────────────────────────────────────────── */

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
    {/* Black rounded-square background */}
    <rect width="24" height="24" rx="6" fill="#000000" />

    {/* Red shadow — shifted right */}
    <path
      d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.971-1.166-1.956-1.282-2.645h.004C16.368 1.325 16.393 1 16.398 1h-3.795v14.529c0 .05 0 .099-.002.147v.05a2.27 2.27 0 0 1-2.27 2.131 2.27 2.27 0 0 1-2.27-2.27 2.27 2.27 0 0 1 2.27-2.27c.222 0 .436.033.638.092v-3.88a6.104 6.104 0 0 0-.638-.033 6.065 6.065 0 0 0-6.065 6.065 6.065 6.065 0 0 0 6.065 6.065 6.065 6.065 0 0 0 6.065-6.065V8.676a9.195 9.195 0 0 0 5.373 1.701V6.59s-1.023.044-2.448-.028z"
      fill="#EE1D52"
      transform="translate(0.5, 0)"
    />

    {/* Teal shadow — shifted left */}
    <path
      d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.971-1.166-1.956-1.282-2.645h.004C16.368 1.325 16.393 1 16.398 1h-3.795v14.529c0 .05 0 .099-.002.147v.05a2.27 2.27 0 0 1-2.27 2.131 2.27 2.27 0 0 1-2.27-2.27 2.27 2.27 0 0 1 2.27-2.27c.222 0 .436.033.638.092v-3.88a6.104 6.104 0 0 0-.638-.033 6.065 6.065 0 0 0-6.065 6.065 6.065 6.065 0 0 0 6.065 6.065 6.065 6.065 0 0 0 6.065-6.065V8.676a9.195 9.195 0 0 0 5.373 1.701V6.59s-1.023.044-2.448-.028z"
      fill="#69C9D0"
      transform="translate(-0.5, 0)"
    />

    {/* White main note icon */}
    <path
      d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.971-1.166-1.956-1.282-2.645h.004C16.368 1.325 16.393 1 16.398 1h-3.795v14.529c0 .05 0 .099-.002.147v.05a2.27 2.27 0 0 1-2.27 2.131 2.27 2.27 0 0 1-2.27-2.27 2.27 2.27 0 0 1 2.27-2.27c.222 0 .436.033.638.092v-3.88a6.104 6.104 0 0 0-.638-.033 6.065 6.065 0 0 0-6.065 6.065 6.065 6.065 0 0 0 6.065 6.065 6.065 6.065 0 0 0 6.065-6.065V8.676a9.195 9.195 0 0 0 5.373 1.701V6.59s-1.023.044-2.448-.028z"
      fill="white"
    />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.5 12 20.5 12 20.5s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
      fill="#FF0000"
    />
    <path d="M9.75 15.395l6.25-3.395-6.25-3.395v6.79z" fill="white" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ig-grad" cx="30%" cy="107%" r="130%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="90%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
    <rect x="6.5" y="6.5" width="11" height="11" rx="3" stroke="white" strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5" fill="none" />
    <circle cx="17" cy="7" r="1" fill="white" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#1877F2" />
    <path
      d="M16.671 15.469l.445-2.906H14.3v-1.887c0-.795.39-1.569 1.634-1.569H17.2V6.691S16.07 6.5 14.99 6.5c-2.126 0-3.515 1.288-3.515 3.62v2.051H9v2.906h2.475V22h3.051v-6.531h2.145z"
      fill="white"
    />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#000000" />
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L2.25 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="white"
    />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#25D366" />
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
      fill="white"
    />
    <path
      d="M12.004 2.003c-5.51 0-9.995 4.484-9.995 9.994 0 1.762.461 3.466 1.338 4.967L2 22l5.145-1.347a9.959 9.959 0 004.859 1.25c5.51 0 9.996-4.485 9.996-9.995 0-5.51-4.486-9.905-9.996-9.905zm0 18.29a8.273 8.273 0 01-4.218-1.16l-.302-.18-3.135.821.836-3.051-.196-.314a8.272 8.272 0 01-1.27-4.407c0-4.577 3.726-8.303 8.285-8.303 4.578 0 8.304 3.726 8.304 8.303 0 4.577-3.726 8.29-8.304 8.29z"
      fill="white"
    />
  </svg>
);

const SocialIconBranded = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case "tiktok": return <TikTokIcon />;
    case "youtube": return <YouTubeIcon />;
    case "instagram": return <InstagramIcon />;
    case "facebook": return <FacebookIcon />;
    case "x": return <XIcon />;
    case "whatsapp": return <WhatsAppIcon />;
    default: return null;
  }
};

const footerLinks = [
  {
    title: "Shop",
    links: [
      { href: "/category/3d-printers", label: "3D Printers" },
      { href: "/category/materials", label: "Materials" },
      { href: "/category/spare-parts", label: "Spare Parts" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/downloads", label: "Downloads & Resources" },
      { href: "/printing-service", label: "Printing Service" },
      { href: "https://discord.gg/creality", label: "Discord Server" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/support", label: "Help Center" },
      { href: `mailto:${SUPPORT_EMAIL}`, label: SUPPORT_EMAIL },
      { href: "/support/shipping", label: "Shipping" },
      { href: "/support/warranty", label: "Warranty" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "Our Story" },
      { href: "/contact", label: "General Inquiries" },
      { href: "/contact", label: INQUIRY_EMAIL },
    ],
  },
];



function AccordionSection({ group }: { group: typeof footerLinks[0] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 py-4 md:border-none md:py-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left md:pointer-events-none md:cursor-default md:justify-start"
        aria-expanded={open}
      >
        <p className="text-sm font-semibold text-gray-900">{group.title}</p>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-300 md:hidden ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-300 ease-in-out md:mt-4 md:grid-rows-[1fr] ${open ? "grid-rows-[1fr] pt-4" : "grid-rows-[0fr]"
          }`}
      >
        <nav className="flex flex-col gap-3 overflow-hidden text-sm text-gray-500">
          {group.links.map((link, index) =>
            link.href.startsWith("mailto:") || link.href.startsWith("http") ? (
              <a
                key={`${link.href}-${index}`}
                href={link.href}
                className="transition hover:text-gray-900"
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={`${link.href}-${index}`}
                href={link.href}
                className="transition hover:text-gray-900"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </div>
  );
}

export default function Footer() {
  const [socialToggle, setSocialToggle] = useState<"official" | "local">("local");
  const activeSocials = SOCIAL_LINKS[socialToggle];

  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
          {/* Logo & Social Links */}
          <div className="max-w-xs space-y-6">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.svg"
                alt="Creality Kuwait Logo"
                width={160}
                height={45}
                className="object-contain"
                style={{ height: "auto" }}
              />
            </Link>

            <p className="text-sm text-gray-500">
              Transforming ideas into reality with advanced manufacturing hardware for Kuwait.
            </p>

            <div className="space-y-4">
              {/* Toggles */}
              <div className="flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                  type="button"
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${socialToggle === "local" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  onClick={() => setSocialToggle("local")}
                >
                  Kuwait
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${socialToggle === "official" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  onClick={() => setSocialToggle("official")}
                >
                  GCC
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeSocials.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm transition-transform duration-150 hover:scale-110 hover:shadow-md"
                    aria-label={`Visit us on ${social.platform}`}
                  >
                    <SocialIconBranded platform={social.platform} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Links grid/accordion */}
          <div className="flex-1 lg:max-w-2xl">
            <div className="flex flex-col md:grid md:grid-cols-4 md:gap-8">
              {footerLinks.map((group) => (
                <AccordionSection key={group.title} group={group} />
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Platforms</p>
              <CrealityCloudCard />
            </div>
          </div>
        </div>

        <div
          suppressHydrationWarning
          className="mt-16 border-t border-gray-200 pt-6 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400"
        >
          © {new Date().getFullYear()} Kites Holding Group. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
