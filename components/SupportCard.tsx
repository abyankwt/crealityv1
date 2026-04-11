"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { formatPrice } from "@/lib/price";

const FALLBACK_IMAGE = "/images/product-placeholder.svg";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type SupportCardProps = {
  href?: string;
  title: string;
  description?: string;
  icon?: IconComponent;
  image?: string;
  price?: number;
  buttonLabel?: string;
  onButtonClick?: () => void;
  buttonDisabled?: boolean;
};

export default function SupportCard({
  href,
  title,
  description,
  icon: Icon,
  image,
  price,
  buttonLabel,
  onButtonClick,
  buttonDisabled = false,
}: SupportCardProps) {
  const [imageSrc, setImageSrc] = useState(image || "");

  useEffect(() => {
    setImageSrc(image || "");
  }, [image]);

  const cardClassName =
    "group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md";

  const content = (
    <>
      {imageSrc ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f5f5f5]">
          <Image
            src={imageSrc}
            alt={title}
            fill
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
            onError={() => setImageSrc(FALLBACK_IMAGE)}
          />
        </div>
      ) : Icon && price !== undefined ? (
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 transition duration-300 group-hover:from-black group-hover:to-gray-800">
          <Icon className="h-14 w-14 text-white opacity-90" />
        </div>
      ) : Icon ? (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 transition group-hover:bg-black group-hover:text-white">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
      ) : null}
      {price !== undefined ? (
        <p className={`${description ? "mt-4" : "mt-3"} text-sm font-bold text-text sm:text-base`}>
          {formatPrice(price)}
        </p>
      ) : null}
      {buttonLabel ? (
        <button
          type="button"
          onClick={onButtonClick}
          disabled={buttonDisabled}
          className="mt-auto inline-flex min-h-11 w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {buttonLabel}
        </button>
      ) : null}
    </>
  );

  if (href && !buttonLabel) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
