"use client";

import { useState } from "react";
import { Plus, Search, TrendingUp, Sparkles, BadgeDollarSign } from "lucide-react";
import ModelCard from "@/components/downloads/ModelCard";
import UploadModelModal from "@/components/downloads/UploadModelModal";
import { MARKETPLACE_MODELS } from "@/lib/mockModels";

type MarketplaceFilter = "trending" | "new" | "free" | "paid";

const FILTERS: { id: MarketplaceFilter; label: string; icon: typeof TrendingUp }[] = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "new", label: "New", icon: Sparkles },
  { id: "free", label: "Free", icon: BadgeDollarSign },
  { id: "paid", label: "Paid", icon: BadgeDollarSign },
];

export default function ModelRepository() {
  const [search, setSearch] = useState("");
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MarketplaceFilter>("trending");

  const query = search.trim().toLowerCase();
  const filteredModels = MARKETPLACE_MODELS
    .filter((model) => {
      if (!query) {
        return true;
      }

      return (
        model.title.toLowerCase().includes(query) ||
        model.creator.toLowerCase().includes(query) ||
        model.category.toLowerCase().includes(query)
      );
    })
    .filter((model) => {
      if (activeFilter === "free") {
        return model.price === null;
      }

      if (activeFilter === "paid") {
        return model.price !== null;
      }

      return true;
    })
    .sort((left, right) => {
      if (activeFilter === "new") {
        return (
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
      }

      const leftScore = left.likes * 3 + left.downloads;
      const rightScore = right.likes * 3 + right.downloads;

      return rightScore - leftScore;
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900">3D Models Marketplace</h2>
          <p className="text-sm text-gray-500">
            Browse printable designs with creator profiles, pricing, and community stats.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-lg sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          + Upload Model
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search models or creators..."
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-black focus:outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <p className="text-sm text-gray-500">
          {filteredModels.length} model{filteredModels.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const Icon = filter.icon;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                activeFilter === filter.id
                  ? "border-black bg-black text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {filter.label}
            </button>
          );
        })}
      </div>

      {filteredModels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center text-sm text-gray-500">
          No models matched your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      )}

      {isUploadOpen ? <UploadModelModal onClose={() => setUploadOpen(false)} /> : null}
    </div>
  );
}
