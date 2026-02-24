"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqProps = {
  items: FaqItem[];
};

export default function FaqAccordion({ items }: FaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className="rounded-xl border border-gray-200 bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-gray-900">
                {item.question}
              </span>
              <span className="text-lg text-gray-500">
                {isOpen ? "-" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-gray-600">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
