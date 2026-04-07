"use client";

import Image from "next/image";
import clsx from "clsx";
import {
  normalizeImageUrl,
  shouldBypassImageOptimization,
} from "@/lib/image";

type SmartImageProps = {
  src: string;
  alt: string;
  mode: "product" | "banner";
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

export default function SmartImage({
  src,
  alt,
  mode,
  sizes,
  priority = false,
  className,
  imageClassName,
}: SmartImageProps) {
  const resolvedSrc = normalizeImageUrl(src);
  const containerClassName =
    mode === "product"
      ? "aspect-square"
      : "aspect-[4/3] md:aspect-[16/7]";

  const resolvedSizes =
    sizes ??
    (mode === "product"
      ? "(max-width:768px) 50vw, 25vw"
      : "(max-width:768px) 100vw, 80vw");

  const defaultImageClassName =
    mode === "product"
      ? "product-image object-contain object-center"
      : "object-contain object-center md:object-cover";

  return (
    <div
      className={clsx(
        "relative w-full overflow-hidden bg-neutral-100",
        mode === "banner" && "hero-banner",
        containerClassName,
        className
      )}
    >
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes={resolvedSizes}
        unoptimized={shouldBypassImageOptimization(resolvedSrc)}
        className={clsx(defaultImageClassName, imageClassName)}
      />
    </div>
  );
}
