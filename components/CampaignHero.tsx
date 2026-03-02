"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CampaignSlide } from "@/config/campaigns";

type CampaignHeroProps = {
    slides: CampaignSlide[];
};

export default function CampaignHero({ slides }: CampaignHeroProps) {
    const [current, setCurrent] = useState(0);
    const active = slides.filter((s) => s.isActive);

    const next = useCallback(() => {
        setCurrent((i) => (i + 1) % active.length);
    }, [active.length]);

    const prev = useCallback(() => {
        setCurrent((i) => (i - 1 + active.length) % active.length);
    }, [active.length]);

    /* Auto-rotate every 5 s */
    useEffect(() => {
        if (active.length <= 1) return;
        const id = setInterval(next, 5000);
        return () => clearInterval(id);
    }, [active.length, next]);

    if (active.length === 0) return null;

    return (
        <section className="mx-auto w-full max-w-6xl px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
            <div className="group relative overflow-hidden rounded-2xl shadow-sm bg-gray-100 h-[300px] sm:h-[340px] md:h-[400px] lg:h-[440px]">
                {/* ── Slides ── */}
                {active.map((slide, index) => {
                    const overlay = Math.min(slide.overlayOpacity ?? 0.05, 0.10);
                    const isLight = slide.textColor === "light";

                    return (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === current
                                ? "opacity-100 z-10 visible"
                                : "opacity-0 z-0 invisible pointer-events-none"
                                }`}
                        >
                            {/* Background image */}
                            <Image
                                src={slide.backgroundImage}
                                alt={slide.title}
                                fill
                                priority={index === 0}
                                className="object-cover campaign-hero-img"
                                style={{
                                    "--hero-pos-mobile": slide.mobileObjectPosition || slide.objectPosition || "center center",
                                    "--hero-pos-desktop": slide.objectPosition || "center center",
                                } as React.CSSProperties}
                                sizes="(max-width: 1152px) 100vw, 1152px"
                            />

                            {/* Subtle overlay */}
                            <div
                                className="absolute inset-0"
                                style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
                            />

                            {/* ── CTA Buttons (bottom-left) ── */}
                            <div className="relative z-20 flex h-full flex-col justify-end pb-10 sm:pb-12 md:pb-14 px-5 sm:px-8 md:px-12 lg:px-16">
                                <div className="flex flex-row flex-wrap items-center gap-3 md:gap-4">
                                    <Link
                                        href={slide.primaryCTA.link}
                                        className="inline-flex items-center justify-center rounded-full bg-[#0ed145] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0cb73b] md:text-base"
                                    >
                                        {slide.primaryCTA.text}
                                    </Link>

                                    {slide.secondaryCTA && (
                                        <Link
                                            href={slide.secondaryCTA.link}
                                            className={`inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-medium transition-colors md:text-base ${isLight
                                                ? "border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                                                : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                                                }`}
                                        >
                                            {slide.secondaryCTA.text}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* ── Desktop arrows (hidden on mobile) ── */}
                {active.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={prev}
                            className="absolute left-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-white/70 p-1.5 text-gray-700 shadow-sm backdrop-blur transition-opacity hover:bg-white md:block md:opacity-0 md:group-hover:opacity-100"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-white/70 p-1.5 text-gray-700 shadow-sm backdrop-blur transition-opacity hover:bg-white md:block md:opacity-0 md:group-hover:opacity-100"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}

                {/* ── Indicator dots ── */}
                {active.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
                        {active.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setCurrent(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === current
                                    ? "w-5 bg-gray-900"
                                    : "w-1.5 bg-gray-900/25 hover:bg-gray-900/50"
                                    }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
