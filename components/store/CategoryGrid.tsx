import Image from "next/image";
import Link from "next/link";

type CategoryItem = {
  title: string;
  description: string;
  cta: string;
  slug: string;
  image: string;
};

const categories: CategoryItem[] = [
  {
    title: "3D Printers",
    description: "FDM and resin systems",
    cta: "View printers",
    slug: "3d-printers",
    image: "/images/printers.jpg",
  },
  {
    title: "Materials",
    description: "Filament and resin types",
    cta: "View materials",
    slug: "materials",
    image: "/images/materials.jpg",
  },
  {
    title: "Spare Parts",
    description: "Nozzles, plates, hotends",
    cta: "View parts",
    slug: "spare-parts",
    image: "/images/spareparts.jpg",
  },
  {
    title: "3D Scanners",
    description: "Portable and professional",
    cta: "View scanners",
    slug: "3d-scanners",
    image: "/images/printers.jpg",
  },
  {
    title: "Post Processing",
    description: "Wash, cure, and finish",
    cta: "View tools",
    slug: "post-processing",
    image: "/images/materials.jpg",
  },
  {
    title: "Accessories",
    description: "Upgrades and add-ons",
    cta: "View accessories",
    slug: "accessories",
    image: "/images/spareparts.jpg",
  },
];

function CategoryCard({ title, description, cta, slug, image }: CategoryItem) {
  return (
    <Link
      href={`/category/${slug}`}
      className="group relative flex h-32 items-end overflow-hidden rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md sm:h-36"
    >
      <Image
        src={image}
        alt={title}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition duration-300 ease-out group-hover:scale-[1.03]"
        loading="lazy"
      />
      {/* Dark gradient strip — cleaner than full overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="relative z-10 w-full">
        <p className="text-[11px] text-white/70">{description}</p>
        <div className="mt-0.5 flex items-end justify-between">
          <span className="text-sm font-semibold text-white">{title}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60 transition group-hover:text-white/90">
            {cta} →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CategoryGrid() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
            Categories
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[#0b0b0b] sm:text-[28px]">
            Hardware built for every workflow.
          </h2>
        </div>
        <Link
          href="/store"
          className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 transition hover:text-[#0b0b0b]"
        >
          View all
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
        {categories.map((category) => (
          <CategoryCard key={category.slug} {...category} />
        ))}
      </div>
    </section>
  );
}
