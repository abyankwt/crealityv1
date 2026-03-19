"use client";

import { useState } from "react";
import { ChevronDown, Gift, Package, RefreshCcw, User } from "lucide-react";
import OrdersSection from "./OrdersSection";
import SubscriptionsSection from "./SubscriptionsSection";
import LoyaltySection from "./LoyaltySection";
import ProfileSection from "./ProfileSection";
import LogoutButton from "./LogoutButton";
import type { UserSession } from "@/lib/types";

type Tab = "orders" | "subscriptions" | "loyalty" | "profile";

const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
  { key: "orders", label: "Orders", icon: Package },
  { key: "subscriptions", label: "Subscriptions", icon: RefreshCcw },
  { key: "loyalty", label: "Loyalty & Rewards", icon: Gift },
  { key: "profile", label: "Profile", icon: User },
];

type Props = {
  session: UserSession | null;
};

export default function DashboardTabs({ session }: Props) {
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
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
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
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Icon className="h-4 w-4 text-gray-500" />
                  {tab.label}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen ? (
                <div className="border-t border-gray-100 px-4 py-4">
                  {tab.key === "orders" ? <OrdersSection /> : null}
                  {tab.key === "subscriptions" ? <SubscriptionsSection /> : null}
                  {tab.key === "loyalty" ? <LoyaltySection /> : null}
                  {tab.key === "profile" ? <ProfileSection session={session} /> : null}
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
        {activeTab === "orders" ? <OrdersSection /> : null}
        {activeTab === "subscriptions" ? <SubscriptionsSection /> : null}
        {activeTab === "loyalty" ? <LoyaltySection /> : null}
        {activeTab === "profile" ? <ProfileSection session={session} /> : null}
      </div>
    </div>
  );
}
