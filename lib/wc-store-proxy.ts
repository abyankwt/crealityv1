import { NextResponse, type NextRequest } from "next/server";

const NONCE_HEADER = "X-WC-Store-API-Nonce";

/**
 * Proxy a request to the WooCommerce Store API.
 *
 * - Forwards `cookie` and `X-WC-Store-API-Nonce` from the client.
 * - Captures `set-cookie` and the updated nonce from Woo's response.
 * - Returns both headers back to the client so the browser and
 *   `lib/cart.ts` can keep the session alive.
 */
export async function proxyToWooStore(
    path: string,
    request: NextRequest
): Promise<NextResponse> {
    const baseUrl = process.env.WC_BASE_URL;
    if (!baseUrl) {
        return NextResponse.json(
            { error: "WC_BASE_URL environment variable is not set." },
            { status: 500 }
        );
    }

    const url = `${baseUrl.replace(/\/$/, "")}/wp-json/wc/store/${path}`;

    /* ── Build outgoing headers ── */
    const outgoing = new Headers();

    // Forward cookies (session)
    const cookie = request.headers.get("cookie");
    if (cookie) {
        outgoing.set("cookie", cookie);
    }

    // Forward nonce
    const nonce = request.headers.get(NONCE_HEADER);
    if (nonce) {
        outgoing.set(NONCE_HEADER, nonce);
    }

    // Content-Type for POST/PUT/PATCH
    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
        outgoing.set("content-type", "application/json");
    }

    /* ── Read request body (if any) ── */
    let body: string | undefined;
    if (method !== "GET" && method !== "HEAD") {
        try {
            const json = await request.json();
            body = JSON.stringify(json);
        } catch {
            // No body or invalid JSON — continue without body
        }
    }

    /* ── Fetch from WooCommerce ── */
    let wooResponse: Response;
    try {
        wooResponse = await fetch(url, {
            method,
            headers: outgoing,
            body,
            credentials: "include",
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        return NextResponse.json(
            { error: `Failed to reach WooCommerce: ${msg}` },
            { status: 502 }
        );
    }

    /* ── Parse response ── */
    const text = await wooResponse.text();
    let data: unknown;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    /* ── Build response headers for client ── */
    const responseHeaders = new Headers();

    // Forward set-cookie so the browser persists the WC session
    const setCookie = wooResponse.headers.get("set-cookie");
    if (setCookie) {
        responseHeaders.set("set-cookie", setCookie);
    }

    // Forward the (possibly updated) nonce back to the client
    const responseNonce = wooResponse.headers.get(NONCE_HEADER);
    if (responseNonce) {
        responseHeaders.set(NONCE_HEADER, responseNonce);
    }

    // Expose the nonce header to client-side JavaScript
    responseHeaders.set("Access-Control-Expose-Headers", NONCE_HEADER);

    return NextResponse.json(data, {
        status: wooResponse.status,
        headers: responseHeaders,
    });
}
