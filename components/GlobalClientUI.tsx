"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { CrealityPopupData } from "@/types/creality-cms";

// Lazy-load floating client-only UI — must be in a Client Component
// because `ssr: false` is only allowed in Client Components in App Router
const RouteProgressBar = dynamic(() => import("@/components/RouteProgressBar"), {
    ssr: false,
});

const CompareBar = dynamic(() => import("@/components/compare/CompareBar"), {
    ssr: false,
});

const PromoPopup = dynamic(() => import("@/components/PromoPopup"), {
    ssr: false,
});

const SupportChatbot = dynamic(() => import("@/components/SupportChatbot"), {
    ssr: false,
});

type GlobalClientUIProps = {
    popupData: CrealityPopupData | null;
};

export default function GlobalClientUI({ popupData }: GlobalClientUIProps) {
    return (
        <>
            <Suspense fallback={null}>
                <RouteProgressBar />
            </Suspense>
            <CompareBar />
            <PromoPopup data={popupData} />
            <SupportChatbot />
        </>
    );
}
