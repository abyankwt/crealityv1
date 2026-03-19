import Image from "next/image";
import Link from "next/link";
import { Download, Heart, Tag } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ModelCard from "@/components/downloads/ModelCard";
import {
  formatModelPrice,
  getMarketplaceModelById,
  MARKETPLACE_MODELS,
} from "@/lib/mockModels";

type ModelDetailPageProps = {
  params: Promise<{ id: string }>;
};

const formatStatCount = (value: number) => new Intl.NumberFormat("en-US").format(value);
const getCreatorInitials = (creator: string) =>
  creator
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

export async function generateStaticParams() {
  return MARKETPLACE_MODELS.map((model) => ({ id: model.id }));
}

export async function generateMetadata(
  { params }: ModelDetailPageProps
): Promise<Metadata> {
  const { id } = await params;
  const model = getMarketplaceModelById(id);

  if (!model) {
    return {
      title: "Model not found | Creality Kuwait",
    };
  }

  return {
    title: `${model.title} | 3D Models Marketplace`,
    description: model.description,
  };
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { id } = await params;
  const model = getMarketplaceModelById(id);

  if (!model) {
    notFound();
  }

  const relatedModels = MARKETPLACE_MODELS.filter((candidate) => {
    return candidate.id !== model.id && candidate.category === model.category;
  }).slice(0, 4);

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8">
        <Link
          href="/downloads"
          className="inline-flex items-center text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          Back to 3D Models
        </Link>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] bg-gray-100 sm:aspect-[5/4]">
              <Image
                src={model.image}
                alt={model.title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-wide text-primary">
                  {model.category}
                </p>
                <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
                  {model.title}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                    {getCreatorInitials(model.creator)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{model.creator}</p>
                    <p className="text-xs text-gray-500">Marketplace creator</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Price
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {formatModelPrice(model.price)}
                </p>
              </div>

              <div className="flex items-center gap-5 text-sm text-gray-500">
                <span className="inline-flex items-center gap-2">
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  {formatStatCount(model.likes)} likes
                </span>
                <span className="inline-flex items-center gap-2">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {formatStatCount(model.downloads)} downloads
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  {model.price === null ? "Download" : "Buy"}
                </button>
                <Link
                  href="/support"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            <p className="mt-4 text-sm leading-7 text-gray-600">{model.description}</p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {model.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Related Models</h2>
              <p className="mt-1 text-sm text-gray-500">
                More designs from the {model.category} category.
              </p>
            </div>
            <Link
              href="/downloads"
              className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
            >
              View all
            </Link>
          </div>

          {relatedModels.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {relatedModels.map((relatedModel) => (
                <ModelCard key={relatedModel.id} model={relatedModel} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
              No related models available yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
