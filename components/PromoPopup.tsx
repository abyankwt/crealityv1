"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { POPUP_CONFIG } from "@/config/popup-config";
import type { CrealityPopupData } from "@/types/creality-cms";

const STORAGE_KEY = "creality_promo_v2_dismissed";
const FALLBACK_IMAGE = "/images/product-placeholder.svg";

type PromoPopupProps = {
    data: CrealityPopupData | null;
};

export default function PromoPopup({ data }: PromoPopupProps) {

    const [open, setOpen] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!data?.enabled) return;

        // Check localStorage dismiss timestamp
        const check = () => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const dismissed = parseInt(raw, 10);
                    const elapsed = Date.now() - dismissed;
                    if (elapsed < POPUP_CONFIG.dismissDuration) return; // still suppressed
                }
            } catch {
                // ignore
            }
            // Open after configured delay
            const timer = setTimeout(() => {
                setOpen(true);
                // Move focus to close button for accessibility
                setTimeout(() => closeButtonRef.current?.focus(), 50);
            }, POPUP_CONFIG.delay);
            return timer;
        };

        const timer = check();
        return () => { if (timer) clearTimeout(timer); };
    }, [data?.enabled]);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleDismiss();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDismiss = () => {
        try {
            localStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch {
            // ignore
        }
        setOpen(false);
    };

    const [imageSrc, setImageSrc] = useState(data?.image || FALLBACK_IMAGE);

    useEffect(() => {
        setImageSrc(data?.image || FALLBACK_IMAGE);
    }, [data?.image]);

    if (!data) return null;
    if (!data.enabled) return null;
    if (!open) return null;

    const title = data.title;
    const description = data.description;
    const buttonText = data?.button_text;
    const buttonLink = data?.button_link;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-popup-title"
            onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
        >
            <div className="animate-popup relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl md:max-w-3xl">
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={handleDismiss}
                    className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 shadow-sm backdrop-blur transition hover:bg-gray-100 md:right-6 md:top-6 md:h-10 md:w-10"
                    aria-label="Close promotion"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col gap-4 p-4 md:flex-row md:gap-8 md:p-8">
                    {/* Image left */}
                    <div className="relative h-52 w-full flex-shrink-0 overflow-hidden rounded-2xl bg-[#f5f5f5] md:h-auto md:min-h-[360px] md:w-[42%]">
                        <Image
                            src={imageSrc}
                            alt={title}
                            width={500}
                            height={500}
                            loading="lazy"
                            className="h-full w-full rounded-xl object-cover"
                            onError={() => setImageSrc(FALLBACK_IMAGE)}
                        />
                    </div>

                    {/* Content right */}
                    <div className="flex flex-1 flex-col justify-center gap-4 md:w-[58%] md:gap-6">
                        <div className="space-y-3 md:space-y-4">
                            <h2
                                id="promo-popup-title"
                                className="text-xl font-semibold leading-snug text-gray-900 md:text-3xl"
                            >
                                {title}
                            </h2>
                            <p className="text-sm leading-relaxed text-gray-500 md:pt-1 md:text-base">
                                {description}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                            {buttonText ? (
                                <a
                                    href={buttonLink || "#"}
                                    onClick={handleDismiss}
                                    className="inline-block rounded-lg bg-black px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-900 md:text-base"
                                >
                                    {buttonText}
                                </a>
                            ) : null}
                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 md:px-6 md:py-3.5 md:text-base"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes popup-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .animate-popup {
          animation: popup-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
        </div>
    );
}
