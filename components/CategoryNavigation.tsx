import Image from "next/image";
import Link from "next/link";

type CategoryCardItem = {
  title: string;
  href: string;
  imageName: string;
  alt: string;
};

type CategoryGroup = {
  title: string;
  badgeClassName: string;
  items: CategoryCardItem[];
};

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    title: "3D Printers",
    badgeClassName: "bg-green-100 text-green-700",
    items: [
      {
        title: "FDM Printers",
        href: "/category/fdm-printers",
        imageName: "fdm-printers.png",
        alt: "FDM Printers",
      },
      {
        title: "Resin Printers",
        href: "/category/resin-printers",
        imageName: "resin-printers.png",
        alt: "Resin Printers",
      },
    ],
  },
  {
    title: "Materials",
    badgeClassName: "bg-amber-100 text-amber-700",
    items: [
      {
        title: "Filaments",
        href: "/materials",
        imageName: "filaments.png",
        alt: "Filaments",
      },
      {
        title: "Resins",
        href: "/materials",
        imageName: "resins.png",
        alt: "Resins",
      },
    ],
  },
  {
    title: "Other",
    badgeClassName: "bg-sky-100 text-sky-700",
    items: [
      {
        title: "Accessories",
        href: "/category/accessories",
        imageName: "accessories.png",
        alt: "Accessories",
      },
      {
        title: "3D Scanners",
        href: "/category/3d-scanners",
        imageName: "3d-scanners.png",
        alt: "3D Scanners",
      },
    ],
  },
] as const;

const CATEGORY_IMAGE_VERSION = "20260325";

function getCategoryImageSrc(imageName: string) {
  return `/images/categories/${imageName}?v=${CATEGORY_IMAGE_VERSION}`;
}

function CategoryCard({ title, href, imageName, alt }: CategoryCardItem) {
  const isAccessoriesCard = title === "Accessories";

  return (
    <Link
      href={href}
      prefetch
      className="category-card group flex h-[120px] w-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:scale-105 hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex h-24 w-24 items-center justify-center">
        <Image
          src={getCategoryImageSrc(imageName)}
          alt={alt}
          width={100}
          height={100}
          className="h-[90px] w-[90px] object-contain"
          style={{ height: "auto" }}
          unoptimized
        />
      </div>
      <span className="text-sm font-semibold text-gray-900">
        {isAccessoriesCard ? (
          <>
            <span className="hidden md:inline">Accessories &amp; Tools</span>
            <span className="md:hidden">Accessories</span>
          </>
        ) : (
          title
        )}
      </span>
    </Link>
  );
}

export default function CategoryNavigation() {
  return (
    <section className="bg-[#f8f8f8] py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-5 text-center sm:text-left">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Shop by Category
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Jump straight to the product groups customers browse most.
          </p>
        </div>

        <div className="mb-6 h-px bg-gray-200" />

        <div className="flex flex-wrap justify-center gap-10">
          {CATEGORY_GROUPS.map((group) => (
            <div
              key={group.title}
              className="mb-10 flex min-w-0 flex-col items-center last:mb-0"
            >
              <div className="mb-4 flex items-center justify-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${group.badgeClassName}`}
                >
                  {group.title}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {group.items.map((item, index) => (
                  <CategoryCard key={`${item.href}-${index}`} {...item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
