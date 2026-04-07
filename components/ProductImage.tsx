import Image from "next/image";
import {
  FALLBACK_PRODUCT_IMAGE,
  normalizeImageUrl,
  shouldBypassImageOptimization,
} from "@/lib/image";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

export default function ProductImage({
  src,
  alt,
  className,
}: ProductImageProps) {
  const resolvedSrc = normalizeImageUrl(src || FALLBACK_PRODUCT_IMAGE);

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={600}
      height={600}
      className={["product-image", className].filter(Boolean).join(" ")}
      loading="lazy"
      unoptimized={shouldBypassImageOptimization(resolvedSrc)}
    />
  );
}
