"use client";

import { useState } from "react";
import { ChevronDown, Gift, Package, RefreshCcw, User } from "lucide-react";
import OrdersSection from "./OrdersSection";
import ProfileSection from "./ProfileSection";
import LogoutButton from "./LogoutButton";
import type { UserSession, WooOrder } from "@/lib/types";

type Tab = "orders" | "subscriptions" | "loyalty" | "profile";

const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
  { key: "orders", label: "Orders", icon: Package },
  { key: "subscriptions", label: "Subscriptions", icon: RefreshCcw },
  { key: "loyalty", label: "Loyalty & Rewards", icon: Gift },
  { key: "profile", label: "Profile", icon: User },
];

const COMING_SOON_TABS: Tab[] = ["subscriptions", "loyalty"];

function ComingSoonPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <span className="text-2xl">🚧</span>
      </div>
      <p className="text-sm font-semibold text-gray-700">{label} — Coming Soon</p>
      <p className="mt-1 text-xs text-gray-400">This feature is not available yet. We are working on it.</p>
    </div>
  );
}

type Props = {
  session: UserSession | null;
  initialOrders?: WooOrder[];
};

function TabContent({ tab, session, initialOrders }: { tab: Tab; session: UserSession | null; initialOrders?: WooOrder[] }) {
  if (COMING_SOON_TABS.includes(tab)) {
    const label = tabs.find((t) => t.key === tab)?.label ?? tab;
    return <ComingSoonPanel label={label} />;
  }
  if (tab === "orders") return <OrdersSection initialOrders={initialOrders} />;
  if (tab === "profile") return <ProfileSection session={session} />;
  return null;
}

export default function DashboardTabs({ session, initialOrders }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Welcome back{session ? `, ${session.name}` : ""}
        </h2>
        <p className="text-sm text-gray-500">
          Manage orders, subscriptions, loyalty points, and your profile.
        </p>
      </div>

      <div className="hidden rounded-xl border border-gray-200 bg-gray-50 p-1 sm:flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isComingSoon = COMING_SOON_TABS.includes(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : isComingSoon
                  ? "text-gray-300 hover:text-gray-400"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 sm:hidden">
        {tabs.map((tab) => {
          const isOpen = activeTab === tab.key;
          const Icon = tab.icon;
          const isComingSoon = COMING_SOON_TABS.includes(tab.key);

          return (
            <div
              key={tab.key}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <button
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className={`flex items-center gap-2 text-sm font-semibold ${isComingSoon ? "text-gray-400" : "text-gray-900"}`}>
                  <Icon className="h-4 w-4 text-gray-400" />
                  {tab.label}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen ? (
                <div className="border-t border-gray-100 px-4 py-4">
                  <TabContent tab={tab.key} session={session} initialOrders={initialOrders} />
                </div>
              ) : null}
            </div>
          );
        })}

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-900">Logout</p>
          <p className="mt-1 text-xs text-gray-500">Sign out of your account</p>
          <div className="mt-3">
            <LogoutButton fullWidth />
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
        <TabContent tab={activeTab} session={session} initialOrders={initialOrders} />
      </div>
    </div>
  );
}
