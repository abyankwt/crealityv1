import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(searchParams.get("per_page") ?? "12", 10);

    const baseUrl = process.env.WC_BASE_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!baseUrl || !consumerKey || !consumerSecret) {
        return NextResponse.json(
            { error: "Missing WooCommerce configuration" },
            { status: 500 }
        );
    }

    const normalizedBase = baseUrl.replace(/\/$/, "");
    const url = new URL(`${normalizedBase}/wp-json/wc/v3/products`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
        "base64"
    );

    const response = await fetch(url.toString(), {
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        const body = await response.text();
        return NextResponse.json(
            { error: `WooCommerce request failed (${response.status})`, detail: body },
            { status: response.status }
        );
    }

    const totalPages = parseInt(
        response.headers.get("x-wp-totalpages") ?? "1",
        10
    );
    const totalProducts = parseInt(
        response.headers.get("x-wp-total") ?? "0",
        10
    );
    const products = await response.json();

    return NextResponse.json({
        products,
        pagination: {
            page,
            perPage,
            totalPages,
            totalProducts,
        },
    });
}
