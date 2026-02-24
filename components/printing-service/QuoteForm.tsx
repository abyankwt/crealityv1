"use client";

import { useEffect, useRef, useState } from "react";

const allowedExtensions = ["stl", "obj", "step", "zip"];

type FormStatus = "idle" | "loading" | "success" | "error";

type FormState = {
  status: FormStatus;
  message: string;
};

const initialState: FormState = { status: "idle", message: "" };

export default function QuoteForm() {
  const [state, setState] = useState<FormState>(initialState);
  const [showSticky, setShowSticky] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting);
      },
      { rootMargin: "-120px 0px 0px 0px", threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const validate = (form: HTMLFormElement): string | null => {
    const data = new FormData(form);
    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "material",
      "technology",
      "quantity",
      "deadline",
      "description",
    ];

    for (const field of requiredFields) {
      const value = data.get(field)?.toString().trim();
      if (!value) {
        return "Please complete all required fields.";
      }
    }

    const quantity = Number(data.get("quantity"));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return "Quantity must be at least 1.";
    }

    const file = data.get("file");
    if (!file || !(file instanceof File) || file.size === 0) {
      return "Please attach a printable file.";
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return "Accepted formats: .stl, .obj, .step, .zip";
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state.status === "loading") return;

    const form = event.currentTarget;
    const validationError = validate(form);
    if (validationError) {
      setState({ status: "error", message: validationError });
      return;
    }

    try {
      setState({ status: "loading", message: "Submitting request..." });
      const formData = new FormData(form);
      const response = await fetch("/api/printing-service/quote", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || "Submission failed. Try again.";
        throw new Error(message);
      }

      form.reset();
      setState({
        status: "success",
        message: "Request received. We will respond within 1 business day.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Submission failed.";
      setState({ status: "error", message });
    }
  };

  return (
    <div ref={sectionRef} className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">File upload + quote</h2>
        <p className="text-sm text-gray-500">
          Provide core specs and attach your file. We will confirm pricing and lead
          time.
        </p>
      </div>

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="sm:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Full Name *
            <input
              name="fullName"
              required
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              placeholder="Full name"
            />
          </label>
        </div>

        <div className="sm:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Company
            <input
              name="company"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              placeholder="Company (optional)"
            />
          </label>
        </div>

        <div className="sm:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Email *
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              placeholder="name@company.com"
            />
          </label>
        </div>

        <div className="sm:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Phone *
            <input
              name="phone"
              type="tel"
              required
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              placeholder="+965"
            />
          </label>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Material Type *
            <select
              name="material"
              required
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-black focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>
                Select material
              </option>
              <option value="PLA">PLA</option>
              <option value="ABS">ABS</option>
              <option value="PETG">PETG</option>
              <option value="Nylon">Nylon</option>
              <option value="Resin">Resin</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Technology *
            <select
              name="technology"
              required
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-black focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>
                Select technology
              </option>
              <option value="FDM">FDM</option>
              <option value="Resin">Resin</option>
            </select>
          </label>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Quantity *
            <input
              name="quantity"
              type="number"
              min={1}
              required
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-black focus:outline-none"
              placeholder="1"
            />
          </label>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Deadline *
            <input
              name="deadline"
              type="date"
              required
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-black focus:outline-none"
            />
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Description *
            <textarea
              name="description"
              required
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              placeholder="Part dimensions, finish requirements, or notes."
            />
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            File Upload *
            <input
              name="file"
              type="file"
              accept=".stl,.obj,.step,.zip"
              required
              className="mt-2 w-full rounded-lg border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-black file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
            />
          </label>
          <p className="mt-2 text-xs text-gray-500">
            Accepted formats: .stl, .obj, .step, .zip
          </p>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full rounded-lg bg-black px-5 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            disabled={state.status === "loading"}
          >
            {state.status === "loading" ? "Submitting..." : "Submit request"}
          </button>
        </div>

        {state.status !== "idle" && (
          <div
            className={`sm:col-span-2 rounded-lg border px-4 py-3 text-sm ${
              state.status === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : state.status === "error"
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
            role="status"
            aria-live="polite"
          >
            {state.message}
          </div>
        )}
      </form>

      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Get a quote</p>
            <a
              href="#quote"
              className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white"
            >
              Start now
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
