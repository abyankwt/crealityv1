"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import type { CrealityHeroSlideData } from "@/types/creality-cms";
import { normalizeImageUrl, shouldBypassImageOptimization } from "@/lib/image";

const HERO_API_URL = "/api/hero";

type CampaignHeroProps = {
  initialSlides?: CrealityHeroSlideData[];
};

export default function CampaignHero({ initialSlides }: CampaignHeroProps) {
  const [slides, setSlides] = useState<CrealityHeroSlideData[]>(initialSlides ?? []);
  const [isLoading, setIsLoading] = useState(!initialSlides || initialSlides.length === 0);
  const [current, setCurrent] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
  });

  useEffect(() => {
    // Skip client fetch if server already provided slides
    if (initialSlides && initialSlides.length > 0) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadSlides() {
      try {
        setIsLoading(true);

        const response = await fetch(HERO_API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Hero slider request failed: ${response.status}`);
        }

        const data = (await response.json()) as CrealityHeroSlideData[];
        const nextSlides = Array.isArray(data) ? data : [];
        setSlides(nextSlides);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to load homepage hero slides:", error);
          setSlides([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadSlides();

    return () => controller.abort();
  }, [initialSlides]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const onSelect = () => {
      setCurrent(emblaApi.selectedScrollSnap());
    };

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  const activeSlides = slides
    .filter((slide) => slide.enabled)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const slidesKey = slides.map((s) => `${s.title}-${s.order ?? 0}`).join("|");

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    setCurrent(0);
    emblaApi.reInit();
    emblaApi.scrollTo(0, true);
  }, [emblaApi, slidesKey]);

  useEffect(() => {
    if (!emblaApi || activeSlides.length <= 1) {
      return;
    }

    const id = window.setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => window.clearInterval(id);
  }, [activeSlides.length, emblaApi]);

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
        <div className="overflow-hidden rounded-[28px] border border-[#dfe6dc] bg-gradient-to-br from-white via-[#f8fbf5] to-[#eef5ea] shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="relative min-h-[420px] animate-pulse md:min-h-[500px]">
            <div className="absolute inset-0 bg-gray-100" />
            <div className="relative z-10 flex min-h-[420px] flex-col justify-center gap-4 px-6 py-8 md:max-w-[55%] md:min-h-[500px] md:px-10 md:py-10">
              <div className="h-4 w-32 rounded-full bg-gray-200" />
              <div className="h-12 w-3/4 rounded-2xl bg-gray-200" />
              <div className="h-12 w-2/3 rounded-2xl bg-gray-200" />
              <div className="h-4 w-full rounded-full bg-gray-200/60" />
              <div className="h-4 w-5/6 rounded-full bg-gray-200/60" />
              <div className="mt-4 flex gap-3">
                <div className="h-11 w-32 rounded-full bg-gray-200" />
                <div className="h-11 w-32 rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!activeSlides.length) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
      <div
        className="group relative overflow-hidden rounded-[28px] border border-[#dfe6dc] bg-gradient-to-br from-white via-[#f9fbf7] to-[#eef5ea] shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
      >
        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex">
            {activeSlides.map((slide, index) => {
              const btn1Text = slide.button1_text;
              const btn1Link = slide.button1_link || "#";
              const btn2Text = slide.button2_text;
              const btn2Link = slide.button2_link || "#";
              const imageUrl = slide.image ?? "";

              return (
                <div
                  key={`${slide.title}-${slide.order}-${index}`}
                  className="embla__slide min-w-0 flex-[0_0_100%]"
                >
                  <div className="relative min-h-[420px] md:min-h-[500px]">
                    {/* Background image — fills entire slide */}
                    {imageUrl && (
                      <Image
                        src={normalizeImageUrl(imageUrl)}
                        alt={slide.title}
                        fill
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                        sizes="(max-width: 768px) 100vw, 1152px"
                        unoptimized={shouldBypassImageOptimization(normalizeImageUrl(imageUrl))}
                        className="object-cover"
                      />
                    )}

                    {/* Subtle gradient — only behind text area for readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent md:via-white/30" />

                    {/* Text content positioned over the gradient */}
                    <div className="relative z-10 flex min-h-[420px] flex-col justify-center px-6 py-8 md:max-w-[55%] md:min-h-[500px] md:px-10 md:py-10">
                      {slide.subtitle ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6BBE45] sm:text-sm">
                          {slide.subtitle}
                        </p>
                      ) : null}

                      <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
                        {slide.title}
                      </h2>

                      {slide.description ? (
                        <p className="mt-4 max-w-lg text-sm leading-7 text-gray-600 sm:text-base">
                          {slide.description}
                        </p>
                      ) : null}

                      <div className="mt-8 flex flex-wrap gap-3">
                        {btn1Text ? (
                          <a
                            href={btn1Link}
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0ed145] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0cb73b] md:text-base"
                          >
                            {btn1Text}
                          </a>
                        ) : null}

                        {btn2Text ? (
                          <a
                            href={btn2Link}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 md:text-base"
                          >
                            {btn2Text}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/70 bg-white/90 p-2 text-gray-700 shadow-lg backdrop-blur transition hover:bg-white md:block"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/70 bg-white/90 p-2 text-gray-700 shadow-lg backdrop-blur transition hover:bg-white md:block"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {activeSlides.length > 1 && (
          <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => emblaApi?.scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? "w-8 bg-[#111827]"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
