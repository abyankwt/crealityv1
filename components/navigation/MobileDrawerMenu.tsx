"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  ACCOUNT_NAV_LINKS,
  type NavigationItem,
  type NavigationLink,
} from "@/config/navigation";
import { buildMobileCategorySections } from "@/lib/categoryGroups";
import type { CategoryNode } from "@/lib/categories";

type MobileDrawerMenuProps = {
  navigation: NavigationItem[];
  categories: CategoryNode[];
  onNavigate?: () => void;
};

type DrawerSection = NavigationItem & {
  children?: NavigationLink[];
};

function getChildCategoryHref(parentSlug: string, childSlug: string) {
  return parentSlug === "3d-printers"
    ? `/3d-printers/${childSlug}`
    : `/category/${childSlug}`;
}

function DrawerRow({
  section,
  expanded,
  onChildNavigate,
  onToggle,
}: {
  section: DrawerSection;
  expanded: boolean;
  onChildNavigate?: () => void;
  onToggle: () => void;
}) {
  const hasChildren = Boolean(section.children?.length);
  const panelId = `${section.id}-submenu`;

  return (
    <div className="border-b border-gray-100 transition hover:bg-gray-50">
      <div className="flex items-center justify-between gap-4 py-4">
        <Link
          href={section.href}
          prefetch
          className={`min-w-0 flex-1 text-sm font-medium ${
            section.id === "pre-orders" ? "text-[#2f5d1d]" : "text-gray-900"
          }`}
          onClick={onChildNavigate}
        >
          <span className="flex items-center gap-2">
            <span>{section.label}</span>
            {section.id === "pre-orders" && (
              <span className="rounded-full bg-[#6BBE45] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                New
              </span>
            )}
          </span>
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
              className={`transition-transform duration-300 ${
                expanded ? "rotate-180" : "rotate-0"
              }`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <div
          id={panelId}
          className="flex flex-col gap-2 pb-3 pl-4 text-gray-600 transition-all duration-300"
        >
          {section.children?.map((child) => (
            <Link
              key={`${section.id}-${child.href}-${child.label}`}
              href={child.href}
              prefetch
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

function CategoryAccordion({
  sections,
  onNavigate,
}: {
  sections: ReturnType<typeof buildMobileCategorySections>;
  onNavigate?: () => void;
}) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(
    sections[0]?.id ?? null
  );

  return (
    <div className="space-y-4 pb-4 pl-4">
      {sections.map((section) => {
        const expanded = openGroupId === section.id;
        const contentId = `mobile-category-group-${section.id}`;
        const { category } = section;

        return (
          <div
            key={section.id}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
          >
            <button
              type="button"
              onClick={() =>
                setOpenGroupId((current) =>
                  current === section.id ? null : section.id
                )
              }
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              aria-expanded={expanded}
              aria-controls={contentId}
            >
              <span className="text-base font-semibold leading-tight text-gray-900">
                {section.label}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                  expanded ? "rotate-180" : "rotate-0"
                }`}
                aria-hidden="true"
              />
            </button>

            <div
              id={contentId}
              className={`grid transition-all duration-300 ${
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-gray-200 px-4 py-3">
                  <div className="flex flex-col gap-2.5 pl-1">
                    <Link
                      href={`/category/${category.slug}`}
                      prefetch
                      className="text-sm text-gray-700 transition hover:text-black"
                      onClick={onNavigate}
                    >
                      {section.allLabel}
                    </Link>
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={getChildCategoryHref(category.slug, child.slug)}
                        prefetch
                        className="text-sm text-gray-700 transition hover:text-black"
                        onClick={onNavigate}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MobileDrawerMenu({
  navigation,
  categories,
  onNavigate,
}: MobileDrawerMenuProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sections = navigation.map<DrawerSection>((item) => {
    if (item.kind === "account") {
      return {
        ...item,
        children: ACCOUNT_NAV_LINKS,
      };
    }

    return item;
  });

  const visibleCategories = categories.filter(
    (category) => category.children.length > 0 || categories.length <= 8
  );
  const categorySections = buildMobileCategorySections(visibleCategories);

  const toggleSection = (sectionId: string) => {
    setOpenSection((current) => (current === sectionId ? null : sectionId));
  };

  return (
    <div className="flex flex-col">
      <div>
        {sections.map((section) => {
          const expanded = openSection === section.id;

          if (section.kind === "mega") {
            return (
              <div
                key={section.id}
                className="border-b border-gray-100 transition hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-4 py-4">
                  <Link
                    href={section.href}
                    prefetch
                    className="min-w-0 flex-1 text-sm font-medium text-gray-900"
                    onClick={onNavigate}
                  >
                    {section.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="rounded-md p-1 text-gray-400 transition hover:text-gray-900"
                    aria-expanded={expanded}
                    aria-controls={`${section.id}-submenu`}
                    aria-label={`${expanded ? "Collapse" : "Expand"} ${section.label}`}
                  >
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-300 ${
                        expanded ? "rotate-180" : "rotate-0"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <div
                  id={`${section.id}-submenu`}
                  className={`grid transition-all duration-300 ${
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <CategoryAccordion
                      sections={categorySections}
                      onNavigate={onNavigate}
                    />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <DrawerRow
              key={section.id}
              section={section}
              expanded={expanded}
              onChildNavigate={onNavigate}
              onToggle={() => toggleSection(section.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
