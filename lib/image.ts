export const FALLBACK_PRODUCT_IMAGE = "/images/product-placeholder.svg";

type ImageCandidate = {
  thumbnail?: string | null;
  src?: string | null;
};

export function normalizeImageUrl(src?: string | null) {
  if (!src) {
    return src ?? "";
  }

  if (src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  try {
    const url = new URL(src);

    // Route WordPress media through the local /site rewrite so updates are not
    // held behind Next image optimization caches.
    if (url.pathname.startsWith("/site/")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    return src;
  } catch {
    return src;
  }
}

export function shouldBypassImageOptimization(src?: string | null) {
  if (!src) {
    return false;
  }

  // /site/ paths use the Next.js rewrite → creality.com.kw and can be optimized
  if (src.startsWith("/site/")) {
    return false;
  }

  // Fully external URLs that aren't routed through the local rewrite bypass optimization
  return /^https?:\/\//.test(src);
}

export function resolveImageSource(
  image?: ImageCandidate | null,
  fallback = FALLBACK_PRODUCT_IMAGE
) {
  return normalizeImageUrl(image?.thumbnail || image?.src || fallback);
}
