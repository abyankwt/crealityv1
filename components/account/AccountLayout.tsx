"use client";

import { useState } from "react";

type AccountSection = "dashboard" | "orders" | "addresses" | "details" | "logout";

type NavItem = {
  key: AccountSection;
  label: string;
};

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "orders", label: "Orders" },
  { key: "addresses", label: "Addresses" },
  { key: "details", label: "Account Details" },
  { key: "logout", label: "Logout" },
];

const sectionContent: Record<AccountSection, { title: string; description: string }> = {
  dashboard: {
    title: "Welcome back",
    description: "Track recent activity and manage your store preferences.",
  },
  orders: {
    title: "Your orders",
    description: "Review order history and track current shipments.",
  },
  addresses: {
    title: "Saved addresses",
    description: "Manage billing and shipping addresses for faster checkout.",
  },
  details: {
    title: "Account details",
    description: "Update your profile information and password.",
  },
  logout: {
    title: "Sign out",
    description: "You can return anytime to continue shopping.",
  },
};

export default function AccountLayout() {
  const [activeTab, setActiveTab] = useState<AccountSection>("dashboard");

  return (
    <div className="rounded-2xl bg-gray-50 p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Account
          </p>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeTab === item.key
                    ? "bg-black text-white"
                    : "text-gray-500 hover:bg-gray-50 hover:text-text"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-text">
              {sectionContent[activeTab].title}
            </h1>
            <p className="text-sm text-gray-500">
              {sectionContent[activeTab].description}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
            Content for {sectionContent[activeTab].title} will appear here.
          </div>
        </section>
      </div>
    </div>
  );
}
