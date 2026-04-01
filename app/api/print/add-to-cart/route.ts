import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess, ERROR_MESSAGES, resolveErrorMessage } from "@/lib/errors";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";

const WP_BASE = process.env.WC_BASE_URL?.replace(/\/$/, "") ?? "";
const CHECKOUT_PATH = process.env.NEXT_PUBLIC_WC_CHECKOUT_URL ?? "/site/checkout/";

function getCredentials() {
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;
    if (!consumerKey || !consumerSecret) throw new Error("Missing WooCommerce credentials");
    return { consumerKey, consumerSecret };
}

type AddToCartBody = {
    job_id: number;
    total_cost: number;
    summary: {
        file_name?: string;
        dimensions: string;
        material_grams: number;
        estimated_time: string;
        color?: string;
        material?: string;
        technology?: string;
        quantity?: number;
        provider?: string;
        description?: string;
    };
};

/**
 * POST /api/print/add-to-cart
 * Creates a WooCommerce order for the 3D print job and returns the checkout URL.
 */
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (!token) return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });

        const session = await verifySession(token);
        if (!session) return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });

        const body = (await request.json()) as AddToCartBody;
        if (!body.job_id || !body.total_cost) {
            return NextResponse.json(apiError("Missing job_id or total_cost."), { status: 400 });
        }

        // Create a WooCommerce order via REST API with a fee line item.
        const { consumerKey, consumerSecret } = getCredentials();
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

        const orderPayload = {
            customer_id: session.userId,
            status: "pending",
            set_paid: false,
            fee_lines: [
                {
                    name: `Custom 3D Print Job #${body.job_id}`,
                    total: String(body.total_cost),
                    tax_status: "none",
                },
            ],
            meta_data: [
                { key: "_print_job_id", value: String(body.job_id) },
                { key: "_print_file_name", value: body.summary?.file_name ?? "" },
                { key: "_print_dimensions", value: body.summary?.dimensions ?? "" },
                { key: "_print_material_grams", value: String(body.summary?.material_grams ?? "") },
                { key: "_print_estimated_time", value: body.summary?.estimated_time ?? "" },
                { key: "_print_color", value: body.summary?.color ?? "" },
                { key: "_print_material", value: body.summary?.material ?? "" },
                { key: "_print_technology", value: body.summary?.technology ?? "" },
                { key: "_print_quantity", value: String(body.summary?.quantity ?? "") },
                { key: "_print_provider", value: body.summary?.provider ?? "" },
                { key: "_print_description", value: body.summary?.description ?? "" },
            ],
        };

        const wcRes = await fetch(`${WP_BASE}/wp-json/wc/v3/orders`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(orderPayload),
        });

        const wcBody = await wcRes.json();

        if (!wcRes.ok) {
            const msg = wcBody?.message ?? ERROR_MESSAGES.serverError;
            return NextResponse.json(apiError(msg), { status: wcRes.status });
        }

        // Build checkout URL.
        const orderId = wcBody.id;
        const orderKey = wcBody.order_key;
        const checkoutUrl = `${WP_BASE}${CHECKOUT_PATH}order-pay/${orderId}/?pay_for_order=true&key=${orderKey}`;

        return NextResponse.json(
            apiSuccess({
                order_id: orderId,
                checkout_url: checkoutUrl,
            })
        );
    } catch (error) {
        return NextResponse.json(apiError(resolveErrorMessage(error, ERROR_MESSAGES.serverError)), { status: 500 });
    }
}
