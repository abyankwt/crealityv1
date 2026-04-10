import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMaterialsNavigation } from "@/lib/materials";

export const metadata = {
  title: "Materials",
};

export default async function MaterialsPage() {
  const groups = await getMaterialsNavigation();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="rounded-[2rem] bg-[#f6f8f3] px-6 py-8 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5f6b52]">
          Materials
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">
          Filament and resin categories
        </h1>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">{group.label}</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                {group.links.length} categories
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {group.links.map((link) => (
                <Link
                  key={link.slug}
                  href={link.href}
                  prefetch
                  className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:text-black"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
