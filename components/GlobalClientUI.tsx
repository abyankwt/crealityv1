"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import RouteProgressBar from "@/components/RouteProgressBar";

// Lazy-load floating client-only UI — must be in a Client Component
// because `ssr: false` is only allowed in Client Components in App Router
const CompareBar = dynamic(() => import("@/components/compare/CompareBar"), {
    ssr: false,
});

const PromoPopup = dynamic(() => import("@/components/PromoPopup"), {
    ssr: false,
});

const SupportChatbot = dynamic(() => import("@/components/SupportChatbot"), {
    ssr: false,
});

export default function GlobalClientUI() {
    return (
        <>
            <Suspense fallback={null}>
                <RouteProgressBar />
            </Suspense>
            <CompareBar />
            <PromoPopup />
            <SupportChatbot />
        </>
    );
}
