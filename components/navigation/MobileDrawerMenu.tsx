"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  ACCOUNT_NAV_LINKS,
  ALL_PRODUCTS_CATEGORY_LINKS,
  PRE_ORDERS_SECTION_ID,
  type NavigationItem,
  type NavigationLink,
} from "@/config/navigation";
import { scrollToSectionById } from "@/lib/scrollToSection";

type MobileDrawerMenuProps = {
  navigation: NavigationItem[];
  onNavigate?: () => void;
};

type DrawerSection = NavigationItem & {
  children?: NavigationLink[];
};

function DrawerRow({
  section,
  expanded,
  onChildNavigate,
  onLinkClick,
  onToggle,
}: {
  section: DrawerSection;
  expanded: boolean;
  onChildNavigate?: () => void;
  onLinkClick: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
  onToggle: () => void;
}) {
  const hasChildren = Boolean(section.children?.length);
  const panelId = `${section.id}-submenu`;

  return (
    <div className="border-b border-gray-100 transition hover:bg-gray-50">
      <div className="flex items-center justify-between gap-4 py-4">
        <Link
          href={section.href}
          className="min-w-0 flex-1 text-sm font-medium text-gray-900"
          onClick={onLinkClick}
        >
          {section.label}
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1 text-gray-400 transition hover:text-gray-900"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${section.label}`}
          >
            <ChevronDown
              size={18}
              className={`transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <div id={panelId} className="flex flex-col gap-2 pb-3 pl-4 text-gray-600">
          {section.children?.map((child) => (
            <Link
              key={`${section.id}-${child.href}-${child.label}`}
              href={child.href}
              className="text-sm transition hover:text-gray-900"
              onClick={onChildNavigate}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileDrawerMenu({
  navigation,
  onNavigate,
}: MobileDrawerMenuProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const pathname = usePathname();

  const sections = navigation.map<DrawerSection>((item) => {
    if (item.kind === "mega") {
      return {
        ...item,
        children: ALL_PRODUCTS_CATEGORY_LINKS,
      };
    }

    if (item.kind === "account") {
      return {
        ...item,
        children: ACCOUNT_NAV_LINKS,
      };
    }

    return item;
  });

  const toggleSection = (sectionId: string) => {
    setOpenSection((current) => (current === sectionId ? null : sectionId));
  };

  const handleSectionClick =
    (section: DrawerSection) => (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (section.id !== "pre-orders" || pathname !== "/") {
        onNavigate?.();
        return;
      }

      event.preventDefault();

      const didScroll = scrollToSectionById(PRE_ORDERS_SECTION_ID);

      if (didScroll) {
        onNavigate?.();
        return;
      }

      window.location.assign(section.href);
    };

  return (
    <div className="flex flex-col">
      <div>
        {sections.map((section) => (
          <DrawerRow
            key={section.id}
            section={section}
            expanded={openSection === section.id}
            onChildNavigate={onNavigate}
            onLinkClick={handleSectionClick(section)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>
    </div>
  );
}
