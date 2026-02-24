import Image from "next/image";
import Link from "next/link";
import QuoteForm from "@/components/printing-service/QuoteForm";
import FaqAccordion from "@/components/printing-service/FaqAccordion";

const offerCards = [
  {
    title: "FDM Printing",
    description: "Functional parts with durable thermoplastics.",
  },
  {
    title: "Resin Printing",
    description: "High-detail components with tight tolerances.",
  },
  {
    title: "Post Processing",
    description: "Sanding, finishing, and surface preparation.",
  },
  {
    title: "Batch Production",
    description: "Consistent output for scaled quantities.",
  },
];

const serviceCategories = [
  {
    title: "Rapid Prototyping",
    description: "Fast iteration for engineering and design teams.",
  },
  {
    title: "Production Runs",
    description: "Repeatable parts with controlled QC checks.",
  },
  {
    title: "Custom Fixtures",
    description: "Jigs and tooling tailored to your workflow.",
  },
  {
    title: "End-Use Parts",
    description: "Durable components for final assemblies.",
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "Upload your file",
    description: "Send STL, OBJ, STEP, or ZIP assets.",
  },
  {
    number: "02",
    title: "We review & quote",
    description: "Material, lead time, and finishing options.",
  },
  {
    number: "03",
    title: "Production begins",
    description: "Industrial machines start within 24 hours.",
  },
  {
    number: "04",
    title: "Delivery across Kuwait",
    description: "Tracked shipping to your facility.",
  },
];

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
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
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
                href="#quote"
                className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Get a Quote
              </a>
              <Link
                href="/support"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700"
              >
                Talk to Us
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
            <Image
              src="/images/printers.jpg"
              alt="Industrial 3D printing"
              width={900}
              height={700}
              className="h-full max-h-[360px] w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">What we offer</h2>
            <p className="mt-2 text-sm text-gray-500">
              Core services built for engineering-grade deliverables.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {offerCards.map((card, index) => (
              <div
                key={card.title}
                className="rounded-xl border border-gray-200 bg-[#f9f9f9] p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {card.title}
                    </p>
                    <p className="text-xs text-gray-500">{card.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-[#f8f8f8] py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Service categories</h2>
            <p className="mt-2 text-sm text-gray-500">
              Built for engineering, production, and custom requirements.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {serviceCategories.map((category) => (
              <div
                key={category.title}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {category.title}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step) => (
              <div
                key={step.number}
                className="rounded-xl border border-gray-200 bg-[#f9f9f9] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {step.number}
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {step.title}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="quote" className="border-b border-gray-200 bg-[#f8f8f8] py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <QuoteForm />
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
            href="#quote"
            className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Request a Quote
          </a>
        </div>
      </section>
    </main>
  );
}
