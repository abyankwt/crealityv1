"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { POPUP_CONFIG } from "@/config/popup-config";

const STORAGE_KEY = "creality_promo_v2_dismissed";

export default function PromoPopup() {
    const [open, setOpen] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!POPUP_CONFIG.enabled) return;

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
    }, []);

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

    if (!open) return null;

    const { title, description, image, ctaText, ctaLink } = POPUP_CONFIG;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-popup-title"
            onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
        >
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-popup">
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={handleDismiss}
                    className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 shadow-sm backdrop-blur transition hover:bg-gray-100"
                    aria-label="Close promotion"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col sm:flex-row">
                    {/* Image left */}
                    {image && (
                        <div className="relative h-48 w-full sm:h-auto sm:w-2/5 flex-shrink-0">
                            <Image
                                src={image}
                                alt={title}
                                fill
                                sizes="(max-width: 640px) 100vw, 240px"
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    {/* Content right */}
                    <div className="flex flex-1 flex-col justify-center gap-4 p-6">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6BBE45]">
                                {POPUP_CONFIG.type === "new-product"
                                    ? "New Release"
                                    : POPUP_CONFIG.type === "limited-offer"
                                        ? "Limited Offer"
                                        : "Announcement"}
                            </p>
                            <h2
                                id="promo-popup-title"
                                className="text-xl font-semibold text-gray-900 leading-snug"
                            >
                                {title}
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {description}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Link
                                href={ctaLink}
                                onClick={handleDismiss}
                                className="flex-1 rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-900"
                            >
                                {ctaText}
                            </Link>
                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
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
