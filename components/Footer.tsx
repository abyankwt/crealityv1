"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { SOCIAL_LINKS, SocialLink } from "@/config/social-links";
import { ChevronDown, Instagram, Facebook, Twitter, Youtube, MessageCircle, Video } from "lucide-react";

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
      { href: "/support/shipping", label: "Shipping" },
      { href: "/support/warranty", label: "Warranty" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "Our Story" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
];

const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case "instagram": return <Instagram className="h-4 w-4" />;
    case "facebook": return <Facebook className="h-4 w-4" />;
    case "x": return <Twitter className="h-4 w-4" />;
    case "youtube": return <Youtube className="h-4 w-4" />;
    case "discord": return <MessageCircle className="h-4 w-4" />;
    case "tiktok": return <Video className="h-4 w-4" />;
    default: return null;
  }
};

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
          {group.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
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
              <Image src="/logo.svg" alt="Creality Kuwait Logo" width={160} height={45} className="object-contain" />
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
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:text-black hover:shadow-sm"
                    aria-label={`Visit us on ${social.platform}`}
                  >
                    <SocialIcon platform={social.platform} />
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
          </div>
        </div>

        <div className="mt-16 border-t border-gray-200 pt-6 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
          © {new Date().getFullYear()} Kites Holding Group. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
