"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type SupportCardProps = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export default function SupportCard({
  href,
  title,
  description,
  icon: Icon,
}: SupportCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 transition group-hover:bg-black group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
    </Link>
  );
}
