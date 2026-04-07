import Image from "next/image";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  Box,
  Boxes,
  Droplet,
  Factory,
  Package,
  Printer,
  Rocket,
  Settings,
  Truck,
  Upload,
  Wrench,
} from "lucide-react";
import PrintEstimator from "@/components/printing-service/PrintEstimator";
import FaqAccordion from "@/components/printing-service/FaqAccordion";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type InfoCard = {
  title: string;
  description: string;
  icon: IconComponent;
};

const offerCards = [
  {
    title: "FDM Printing",
    description: "Functional parts with durable thermoplastics.",
    icon: Box,
  },
  {
    title: "Resin Printing",
    description: "High-detail components with tight tolerances.",
    icon: Droplet,
  },
  {
    title: "Post Processing",
    description: "Sanding, finishing, and surface preparation.",
    icon: Wrench,
  },
  {
    title: "Batch Production",
    description: "Consistent output for scaled quantities.",
    icon: Boxes,
  },
] satisfies InfoCard[];

const serviceCategories = [
  {
    title: "Rapid Prototyping",
    description: "Fast iteration for engineering and design teams.",
    icon: Rocket,
  },
  {
    title: "Production Runs",
    description: "Repeatable parts with controlled QC checks.",
    icon: Factory,
  },
  {
    title: "Custom Fixtures",
    description: "Jigs and tooling tailored to your workflow.",
    icon: Wrench,
  },
  {
    title: "End-Use Parts",
    description: "Durable components for final assemblies.",
    icon: Package,
  },
] satisfies InfoCard[];

const workflowSteps = [
  {
    title: "Upload",
    description: "Send STL, OBJ, STEP, or ZIP assets.",
    icon: Upload,
  },
  {
    title: "Configure",
    description: "Choose material, technology, color, and quantity.",
    icon: Settings,
  },
  {
    title: "Production",
    description: "Industrial machines start within 24 hours.",
    icon: Printer,
  },
  {
    title: "Delivery",
    description: "Tracked shipping to your facility.",
    icon: Truck,
  },
] satisfies InfoCard[];

const reasons = [
  {
    title: "Local facility",
    description: "Production located inside Kuwait for faster turnarounds.",
  },
  {
    title: "Industrial machines",
    description: "Commercial-grade equipment for repeatable output.",
  },
  {
    title: "Quality control",
    description: "Dimensional checks and post-process verification.",
  },
  {
    title: "Fast turnaround",
    description: "Responsive scheduling for urgent timelines.",
  },
];

const faqs = [
  {
    question: "What file formats do you accept?",
    answer: "STL, OBJ, STEP, and ZIP bundles are supported.",
  },
  {
    question: "What materials are available?",
    answer: "PLA, ABS, PETG, Nylon, and engineering resin options.",
  },
  {
    question: "How long does production take?",
    answer: "Standard lead time is 2-5 business days after approval.",
  },
  {
    question: "Do you offer bulk discounts?",
    answer: "Yes. Volume pricing is available for production batches.",
  },
  {
    question: "Can I visit your facility?",
    answer: "Visits are available by appointment for qualified projects.",
  },
];

export default function PrintingServicePage() {
  return (
    <main className="bg-[#f8f8f8] text-gray-900">
      <section className="border-b border-gray-200 bg-[#f8f8f8] py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:grid md:grid-cols-2 md:items-center">
          <div className="order-2 space-y-5 md:order-1">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                Printing Service
              </p>
              <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
                Professional 3D Printing Services in Kuwait
              </h1>
              <p className="text-sm text-gray-500 sm:text-base">
                Rapid prototyping, production runs, and industrial-grade output.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="#estimate"
                className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Get Instant Estimate
              </a>
              <Link
                href="/support"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700"
              >
                Talk to Us
              </Link>
            </div>
          </div>
          <div className="order-1 relative overflow-hidden rounded-xl border border-gray-200 bg-white md:order-2">
            <Image
              src="/images/printing-hero.jpg"
              alt="3D printing Kuwait City skyline"
              width={900}
              height={700}
              className="max-h-[360px] w-full object-cover"
              style={{ height: "auto" }}
              priority
            />
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-gray-50 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900">What we offer</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Core services built for engineering-grade deliverables.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {offerCards.map((card) => {
              const Icon = card.icon;
              return (
              <div
                key={card.title}
                className="rounded-xl border p-4 bg-white transition hover:scale-[1.02] hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-900">
                  {card.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {card.description}
                </p>
              </div>
            )})}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900">Service categories</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Built for engineering, production, and custom requirements.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {serviceCategories.map((category) => {
              const Icon = category.icon;
              return (
              <div
                key={category.title}
                className="rounded-xl border p-4 bg-white transition hover:scale-[1.02] hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-900">
                  {category.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {category.description}
                </p>
              </div>
            )})}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-gray-50 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              A streamlined workflow from upload through delivery.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step) => (
              <div
                key={step.title}
                className="rounded-xl border p-4 bg-white transition hover:scale-[1.02] hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-900">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Automated Estimator */}
      <section id="estimate" className="border-b border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <PrintEstimator />
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Why choose Creality Kuwait
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="rounded-xl border border-gray-200 bg-[#f9f9f9] p-4"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {reason.title}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-[#f8f8f8] py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">FAQ</h2>
          </div>
          <FaqAccordion items={faqs} />
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Ready to start your project?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Submit files and receive a formal quote.
            </p>
          </div>
          <a
            href="#estimate"
            className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Get Instant Estimate
          </a>
        </div>
      </section>
    </main>
  );
}
