"use client";

import { useMemo, useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpenText,
  FileDown,
  Headphones,
  MessageCircle,
  PackageSearch,
  Search,
  Wrench,
} from "lucide-react";
import {
  FieldServiceIcon,
  PostWarrantyIcon,
  TechnicalRepairIcon,
} from "@/components/icons/ServiceIcons";
import SupportCard from "@/components/SupportCard";
import SupportFaqAccordion, {
  type SupportFaqItem,
} from "@/components/SupportFaqAccordion";
import { SUPPORT_EMAIL } from "@/config/emails";
import { useCart } from "@/context/CartContext";
import type { SupportService } from "@/lib/supportServices";

const QUICK_ACTIONS = [
  {
    href: "/account/orders",
    title: "Order Support",
    description: "Track orders, payment issues, and post-purchase support requests.",
    icon: PackageSearch,
  },
  {
    href: "/printing-service",
    title: "Printing Services Help",
    description: "Get help with file uploads, materials, pricing, and lead times.",
    icon: Headphones,
  },
  {
    href: "/downloads",
    title: "Downloads",
    description: "Access software, model files, and technical resources in one place.",
    icon: FileDown,
  },
  {
    href: "/downloads",
    title: "Documentation",
    description: "Find user guides, setup references, and maintenance information.",
    icon: BookOpenText,
  },
] as const;

const DEFAULT_SERVICE_ICON = Wrench;

const SERVICE_IMAGES: Record<string, string> = {
  "home-service": "/service-home.png",
  "home-service-2": "/service-home.png",
  "check-up": "/service-dealership.png",
  "printing-service": "/service-dealership.png",
  "out-of-creality": "/service-dealership.png",
  "out-of-creality-service": "/service-dealership.png",
  "out-of-warranty-service": "/service-warranty.png",
  "maintenance-service": "/service-warranty.png",
  "maintenance-service-2": "/service-warranty.png",
};

const SERVICE_TITLE_OVERRIDES: Record<string, string> = {
  "home-service": "Home Service",
  "home-service-2": "Home Service",
  "check-up": "Out of Dealership Service",
  "printing-service": "Out of Dealership Service",
  "out-of-creality": "Out of Dealership Service",
  "out-of-creality-service": "Out of Dealership Service",
  "out-of-warranty-service": "Post-Warranty Service",
  "maintenance-service": "Post-Warranty Service",
  "maintenance-service-2": "Post-Warranty Service",
};

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const SERVICE_ICONS: Record<string, IconComponent> = {
  "check-up": TechnicalRepairIcon,
  "printing-service": TechnicalRepairIcon,
  "maintenance-service": Wrench,
  "maintenance-service-2": Wrench,
  "home-service": FieldServiceIcon,
  "home-service-2": FieldServiceIcon,
  "out-of-warranty-service": PostWarrantyIcon,
  "out-of-creality": TechnicalRepairIcon,
  "out-of-creality-service": TechnicalRepairIcon,
};

const FAQ_ITEMS: SupportFaqItem[] = [
  {
    question: "What is special order?",
    answer:
      "A special order lets you purchase an item that is not currently in stock. These orders usually arrive within 10 to 12 days and require policy confirmation before checkout.",
  },
  {
    question: "What is pre-order?",
    answer:
      "A pre-order reserves an upcoming product before it officially arrives. Availability depends on the launch batch and the estimated release timeline shown on the product page.",
  },
  {
    question: "Delivery time?",
    answer:
      "In-stock products usually follow the normal checkout delivery flow, while special orders typically arrive within 10 to 12 days after confirmation.",
  },
  {
    question: "Payment methods?",
    answer:
      "Orders are processed through the available checkout payment methods configured on the store. If you have payment trouble, contact support and include your order details.",
  },
] as const;

function normalizeServiceToken(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
}

function resolveServiceIcon(service: SupportService) {
  const bySlug = SERVICE_ICONS[normalizeServiceToken(service.slug)];
  if (bySlug) {
    return bySlug;
  }

  const byName = SERVICE_ICONS[normalizeServiceToken(service.title)];
  if (byName) {
    return byName;
  }

  return DEFAULT_SERVICE_ICON;
}

type SupportPageClientProps = {
  initialServices: SupportService[];
};

export default function SupportPageClient({
  initialServices,
}: SupportPageClientProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [query, setQuery] = useState("");
  const [activeServiceId, setActiveServiceId] = useState<number | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) {
      return FAQ_ITEMS;
    }

    return FAQ_ITEMS.filter((item) => {
      return (
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery]);

  const filteredActions = useMemo(() => {
    if (!normalizedQuery) {
      return QUICK_ACTIONS;
    }

    return QUICK_ACTIONS.filter((item) => {
      return (
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery]);

  const filteredServices = useMemo(() => {
    if (!normalizedQuery) {
      return initialServices;
    }

    return initialServices.filter((item) => {
      return (
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [initialServices, normalizedQuery]);

  const handleServiceRequest = async (productId: number) => {
    try {
      setActiveServiceId(productId);
      setServiceError(null);
      await addItem(productId, 1);
      router.push("/checkout");
    } catch (error) {
      console.error("Failed to request service:", error);
      setServiceError(
        error instanceof Error ? error.message : "Unable to add service to cart."
      );
    } finally {
      setActiveServiceId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Help Desk
            </p>
            <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
              Support Center
            </h1>
            <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
              Get help with orders, printing services, downloads, delivery, and
              common store questions from one place.
            </p>
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search support topics"
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-black focus:bg-white"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-gray-500">
              Jump directly to the most common support destinations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {filteredActions.map((action) => (
              <SupportCard
                key={action.title}
                href={action.href}
                title={action.title}
                description={action.description}
                icon={action.icon}
              />
            ))}
          </div>
          {filteredActions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
              No quick actions matched your search.
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Our Services</h2>
            <p className="mt-1 text-sm text-gray-500">
              Request maintenance, repairs, and support services.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {filteredServices.map((service) => (
              <SupportCard
                key={service.id}
                title={SERVICE_TITLE_OVERRIDES[normalizeServiceToken(service.slug)] ?? service.title}
                description={service.description}
                image={SERVICE_IMAGES[normalizeServiceToken(service.slug)]}
                icon={resolveServiceIcon(service)}
                price={service.price}
                buttonLabel={
                  activeServiceId === service.id ? "Adding..." : "Request & Pay"
                }
                buttonDisabled={activeServiceId !== null}
                onButtonClick={() => handleServiceRequest(service.id)}
              />
            ))}
          </div>
          {serviceError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serviceError}
            </div>
          ) : null}
          {filteredServices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
              No services matched your search.
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Frequently Asked Questions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Common answers for ordering, delivery, and payment.
              </p>
            </div>
            {filteredFaqs.length > 0 ? (
              <SupportFaqAccordion items={filteredFaqs} />
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
                No FAQ entries matched your search.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Contact Support</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Need a human response for an order, payment, or product issue? Use
                one of the direct contact options below.
              </p>
              <div className="mt-5 space-y-3">
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Creality Support Request")}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  <MessageCircle className="h-4 w-4" />
                  Talk to Support
                </a>
                <a
                  href={`https://wa.me/96522092260?text=${encodeURIComponent("Hello, I need support with my order.")}`}
                  className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  WhatsApp
                </a>
                <Link
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  {SUPPORT_EMAIL}
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Support Notes</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Include your order number, product name, or printing-service file
                details when you contact support. That reduces back-and-forth and
                speeds up resolution.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
