"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Heart } from "lucide-react";
import type { MarketplaceModel } from "@/lib/mockModels";
import { formatModelPrice } from "@/lib/mockModels";

type ModelCardProps = {
  model: MarketplaceModel;
};

const formatStatCount = (value: number) => new Intl.NumberFormat("en-US").format(value);
const getCreatorInitials = (creator: string) =>
  creator
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function ModelCard({ model }: ModelCardProps) {
  return (
    <Link
      href={`/models/${model.id}`}
      className="group block cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        <Image
          src={model.image}
          alt={model.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-200 group-hover:scale-[1.02] group-hover:opacity-90"
        />
        <span className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium shadow backdrop-blur">
          {formatModelPrice(model.price)}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-primary">
            {model.category}
          </p>
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">
            {model.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white">
              {getCreatorInitials(model.creator)}
            </span>
            <span>{model.creator}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" aria-hidden="true" />
            {formatStatCount(model.likes)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {formatStatCount(model.downloads)}
          </span>
        </div>
      </div>
    </Link>
  );
}
