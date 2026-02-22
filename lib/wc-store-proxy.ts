import { NextResponse, type NextRequest } from "next/server";

/**
 * Header names used by THIS WooCommerce installation.
 * (Discovered via direct curl to the Store API.)
 */
const NONCE_HEADER = "Nonce";
const CART_TOKEN_HEADER = "Cart-Token";

const WC_NONCE_COOKIE = "wc_nonce";
const WC_CART_TOKEN_COOKIE = "wc_cart_token";

/**
 * Proxy a request to the WooCommerce Store API.
 *
 * Session management:
 *  - Cart-Token (JWT) identifies the cart across headless requests.
 *  - Nonce protects mutating (POST) endpoints.
 *  - Both are stored in cookies on OUR domain so they survive browser reloads.
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

    // Forward Cart-Token for session identification
    const clientCartToken = request.headers.get(CART_TOKEN_HEADER);
    const storedCartToken = request.cookies.get(WC_CART_TOKEN_COOKIE)?.value;
    const cartToken = clientCartToken || storedCartToken;
    if (cartToken) {
        outgoing.set(CART_TOKEN_HEADER, cartToken);
    }

    // Forward Nonce: prefer client header, fallback to stored cookie
    const clientNonce = request.headers.get(NONCE_HEADER);
    const storedNonce = request.cookies.get(WC_NONCE_COOKIE)?.value;
    const nonceToSend = clientNonce || storedNonce;
    if (nonceToSend) {
        outgoing.set(NONCE_HEADER, nonceToSend);
    }

    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
        outgoing.set("content-type", "application/json");
    }

    /* ── Read request body ── */
    let body: string | undefined;
    if (method !== "GET" && method !== "HEAD") {
        try {
            const json = await request.json();
            body = JSON.stringify(json);
        } catch {
            // No body — continue
        }
    }

    /* ── Fetch from WooCommerce ── */
    console.log(`[WC Proxy] ${method} ${url}`);
    console.log(`[WC Proxy] Sending Nonce: ${nonceToSend ?? "(none)"}`);
    console.log(`[WC Proxy] Sending Cart-Token: ${cartToken ? cartToken.substring(0, 20) + "…" : "(none)"}`);

    let wooResponse: Response;
    try {
        wooResponse = await fetch(url, { method, headers: outgoing, body });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        return NextResponse.json(
            { error: `Failed to reach WooCommerce: ${msg}` },
            { status: 502 }
        );
    }

    console.log(`[WC Proxy] Response: ${wooResponse.status}`);

    /* ── Parse response body ── */
    const text = await wooResponse.text();
    let data: unknown;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    /* ── Build NextResponse ── */
    const nextResponse = NextResponse.json(data, {
        status: wooResponse.status,
    });

    /* ── Capture and store Cart-Token ── */
    const responseCartToken = wooResponse.headers.get(CART_TOKEN_HEADER);
    if (responseCartToken) {
        console.log(`[WC Proxy] Received Cart-Token: ${responseCartToken.substring(0, 20)}…`);
        nextResponse.cookies.set(WC_CART_TOKEN_COOKIE, responseCartToken, {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            sameSite: "lax",
        });
        nextResponse.headers.set(CART_TOKEN_HEADER, responseCartToken);
    }

    /* ── Capture and store Nonce ── */
    const responseNonce = wooResponse.headers.get(NONCE_HEADER);
    if (responseNonce) {
        console.log(`[WC Proxy] Received Nonce: ${responseNonce}`);
        nextResponse.cookies.set(WC_NONCE_COOKIE, responseNonce, {
            httpOnly: false,
            path: "/",
            maxAge: 60 * 60 * 24,
            sameSite: "lax",
        });
        nextResponse.headers.set(NONCE_HEADER, responseNonce);
    }

    // Expose custom headers to client-side JS
    nextResponse.headers.set(
        "Access-Control-Expose-Headers",
        `${NONCE_HEADER}, ${CART_TOKEN_HEADER}`
    );

    return nextResponse;
}
