"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import type { CrealityPopupData } from "@/types/creality-cms";

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

// Fetch popup data client-side so it never blocks the layout render.
// The popup appears after a delay anyway, so lazy client fetching is ideal.
function PopupLoader() {
    const [popupData, setPopupData] = useState<CrealityPopupData | null>(null);

    useEffect(() => {
        fetch("/api/popup")
            .then((r) => r.ok ? r.json() : null)
            .then((data: CrealityPopupData | null) => { if (data) setPopupData(data); })
            .catch(() => { /* non-critical */ });
    }, []);

    return <PromoPopup data={popupData} />;
}

export default function GlobalClientUI() {
    return (
        <>
            <Suspense fallback={null}>
                <RouteProgressBar />
            </Suspense>
            <CompareBar />
            <PopupLoader />
            <SupportChatbot />
        </>
    );
}
