import { NextResponse } from "next/server";

/** Debug route — lists all WooCommerce REST API categories with their slugs */
export async function GET(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";

    const baseUrl = (process.env.WC_BASE_URL || process.env.WORDPRESS_URL)?.replace(/\/$/, "");
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;

    if (!baseUrl || !key || !secret) {
        return NextResponse.json({ error: "Missing credentials" }, { status: 500 });
    }

    const auth = Buffer.from(`${key}:${secret}`).toString("base64");
    const allCategories: Array<{ id: number; name: string; slug: string; parent: number; count: number }> = [];

    for (let page = 1; page <= 10; page++) {
        const url = `${baseUrl}/wp-json/wc/v3/products/categories?per_page=100&page=${page}&hide_empty=false`;
        const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" });
        if (!res.ok) {
            return NextResponse.json({ error: `REST API error ${res.status}`, body: await res.text() }, { status: res.status });
        }
        const data = await res.json() as Array<{ id: number; name: string; slug: string; parent: number; count: number }>;
        allCategories.push(...data);
        if (data.length < 100) break;
    }

    const filtered = search
        ? allCategories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase()))
        : allCategories;

    return NextResponse.json({
        total: allCategories.length,
        filtered: filtered.length,
        categories: filtered.sort((a, b) => a.name.localeCompare(b.name)).map(c => ({
            id: c.id, name: c.name, slug: c.slug, parent: c.parent, count: c.count,
        })),
    });
}
