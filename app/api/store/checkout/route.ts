import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";
import { enrichCartResponseWithAvailability } from "@/lib/cart-availability";
import { requiresOrderWarning } from "@/lib/availability";

const WC_CART_TOKEN_COOKIE = "wc_cart_token";
const WC_NONCE_COOKIE = "wc_nonce";

type CheckoutBody = {
    billing_address: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        country: string;
        state: string;
        city: string;
        address_1: string;
        address_2?: string;
        postcode?: string;
    };
    shipping_address?: {
        first_name: string;
        last_name: string;
        country: string;
        state: string;
        city: string;
        address_1: string;
        address_2?: string;
        postcode?: string;
    };
    payment_method: string;
    order_warning_acknowledged?: boolean;
};

type WooCheckoutResponse = {
    order_id: number;
    status: string;
    order_key: string;
    customer_note: string;
    payment_result: {
        payment_status: string;
        payment_details: Array<{ key: string; value: string }>;
        redirect_url: string;
    };
};

type WooStoreShippingRate = {
    rate_id?: string;
    selected?: boolean;
};

type WooStoreShippingPackage = {
    package_id?: number | string;
    shipping_rates?: WooStoreShippingRate[];
};

type WooStoreCartResponse = {
    needs_shipping?: boolean;
    shipping_rates?: WooStoreShippingPackage[];
    payment_methods?: string[];
    message?: string;
    code?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function syncStoreHeaders(headers: Record<string, string>, response: Response) {
    const nextCartToken = response.headers.get("Cart-Token");
    if (nextCartToken) {
        headers["Cart-Token"] = nextCartToken;
    }

    const nextNonce = response.headers.get("Nonce");
    if (nextNonce) {
        headers["Nonce"] = nextNonce;
    }
}

function getShippingRateSummary(cart: unknown) {
    if (!isRecord(cart)) {
        return { needsShipping: false, rateCount: 0 };
    }

    const needsShipping = Boolean(cart.needs_shipping);
    const packages = Array.isArray(cart.shipping_rates)
        ? (cart.shipping_rates as WooStoreShippingPackage[])
        : [];
    const rateCount = packages.reduce((count, shippingPackage) => {
        const rates = Array.isArray(shippingPackage?.shipping_rates)
            ? shippingPackage.shipping_rates
            : [];
        return count + rates.length;
    }, 0);

    return { needsShipping, rateCount };
}

/**
 * POST /api/store/checkout
 *
 * Headless checkout using the WooCommerce Store API:
 * 1. Receives billing info + payment method from the Next.js checkout page
 * 2. Forwards to WooCommerce Store API POST /checkout with Cart-Token
 * 3. Returns the payment gateway redirect URL to the frontend
 *
 * The customer never sees the old WooCommerce site.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const baseUrl = process.env.WC_BASE_URL?.replace(/\/$/, "");

    if (!baseUrl) {
        return NextResponse.json(
            { error: "Missing WooCommerce configuration." },
            { status: 500 }
        );
    }

    // Parse the checkout body from the frontend
    let body: CheckoutBody;
    try {
        body = (await request.json()) as CheckoutBody;
    } catch {
        return NextResponse.json(
            { error: "Invalid request body." },
            { status: 400 }
        );
    }

    // Get cart token and nonce from cookies
    const cartToken = request.cookies.get(WC_CART_TOKEN_COOKIE)?.value;
    const nonce = request.cookies.get(WC_NONCE_COOKIE)?.value;

    if (!cartToken) {
        return NextResponse.json(
            { error: "No cart session found. Please add items to your cart." },
            { status: 400 }
        );
    }

    // Verify the user is logged in
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    let customerId: number | undefined;
    if (sessionToken) {
        const session = await verifySession(sessionToken);
        if (session) {
            customerId = session.userId;
        }
    }

    if (!customerId) {
        return NextResponse.json(
            { error: "Please log in or register before placing an order." },
            { status: 401 }
        );
    }

    // Build headers for WooCommerce Store API
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Cart-Token": cartToken,
    };

    if (nonce) {
        headers["Nonce"] = nonce;
    }

    let protectedItemsInCart = false;
    try {
        const cartResponse = await fetch(
            `${baseUrl}/wp-json/wc/store/v1/cart`,
            {
                method: "GET",
                headers,
                cache: "no-store",
            }
        );

        if (cartResponse.ok) {
            const cartData = await cartResponse.json();
            const enrichedCart = await enrichCartResponseWithAvailability(cartData);
            protectedItemsInCart = Boolean(
                enrichedCart &&
                typeof enrichedCart === "object" &&
                Array.isArray((enrichedCart as { items?: Array<{ availability?: { type: "available" | "special" | "preorder" } }> }).items) &&
                (enrichedCart as { items: Array<{ availability?: { type: "available" | "special" | "preorder" } }> }).items.some((item) =>
                    item.availability ? requiresOrderWarning(item.availability.type) : false
                )
            );
        }
    } catch (error) {
        console.error("[Checkout] Failed to validate protected items:", error);
    }

    if (protectedItemsInCart && !body.order_warning_acknowledged) {
        return NextResponse.json(
            {
                error:
                    "Please acknowledge the special order or pre-order policy before checkout.",
            },
            { status: 400 }
        );
    }

    const normalizedBillingAddress = {
        ...body.billing_address,
        country: body.billing_address.country || "KW",
        state: body.billing_address.state || "",
        city: body.billing_address.city || "Kuwait City",
        address_2: body.billing_address.address_2 || "",
        postcode: body.billing_address.postcode || "00000",
    };

    // Use shipping = billing if not provided
    const shippingAddress = {
        first_name:
            body.shipping_address?.first_name || normalizedBillingAddress.first_name,
        last_name:
            body.shipping_address?.last_name || normalizedBillingAddress.last_name,
        country: body.shipping_address?.country || normalizedBillingAddress.country,
        state: body.shipping_address?.state || normalizedBillingAddress.state,
        city: body.shipping_address?.city || normalizedBillingAddress.city,
        address_1: body.shipping_address?.address_1 || normalizedBillingAddress.address_1,
        address_2:
            body.shipping_address?.address_2 || normalizedBillingAddress.address_2 || "",
        postcode:
            body.shipping_address?.postcode || normalizedBillingAddress.postcode || "",
    };

    let customerCartData: WooStoreCartResponse | null = null;
    try {
        const updateCustomerResponse = await fetch(
            `${baseUrl}/wp-json/wc/store/v1/cart/update-customer`,
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    billing_address: normalizedBillingAddress,
                    shipping_address: shippingAddress,
                }),
                cache: "no-store",
            }
        );

        syncStoreHeaders(headers, updateCustomerResponse);

        const updateCustomerText = await updateCustomerResponse.text();
        try {
            customerCartData = updateCustomerText
                ? (JSON.parse(updateCustomerText) as WooStoreCartResponse)
                : null;
        } catch {
            customerCartData = null;
        }

        if (!updateCustomerResponse.ok) {
            const rawMsg = customerCartData?.message || "";
            const errorMessage = rawMsg.includes("<") || rawMsg.includes("wordpress.org")
                ? "Unable to validate your order. Please try again or contact support."
                : rawMsg || "Unable to validate shipping for this address.";
            console.error("[Checkout] Shipping validation failed:", rawMsg);
            return NextResponse.json(
                { error: errorMessage },
                { status: updateCustomerResponse.status }
            );
        }
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unable to validate shipping.";
        console.error("[Checkout] Shipping validation request failed:", message);
        return NextResponse.json(
            { error: message },
            { status: 502 }
        );
    }

    const shippingRateSummary = getShippingRateSummary(customerCartData);
    if (shippingRateSummary.needsShipping && shippingRateSummary.rateCount === 0) {
        return NextResponse.json(
            {
                error:
                    "No shipping rates are available for this Kuwait address. Verify the Kuwait shipping zone and at least one enabled WooCommerce shipping method.",
            },
            { status: 400 }
        );
    }

    if (
        Array.isArray(customerCartData?.payment_methods) &&
        customerCartData.payment_methods.length > 0 &&
        !customerCartData.payment_methods.includes(body.payment_method)
    ) {
        return NextResponse.json(
            {
                error: `Unsupported payment method. Available methods: ${customerCartData.payment_methods.join(", ")}`,
            },
            { status: 400 }
        );
    }

    // Build the Store API checkout payload
    const checkoutPayload = {
        billing_address: normalizedBillingAddress,
        shipping_address: shippingAddress,
        payment_method: body.payment_method,
        customer_id: customerId,
        payment_data: [] as Array<{ key: string; value: string }>,
    };

    // Call the WooCommerce Store API checkout endpoint
    let wooResponse: Response;
    try {
        wooResponse = await fetch(
            `${baseUrl}/wp-json/wc/store/v1/checkout`,
            {
                method: "POST",
                headers,
                body: JSON.stringify(checkoutPayload),
                cache: "no-store",
            }
        );
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        console.error("[Checkout] Failed to reach WooCommerce:", msg);
        return NextResponse.json(
            { error: `Failed to reach payment system: ${msg}` },
            { status: 502 }
        );
    }

    const responseText = await wooResponse.text();
    let responseData: WooCheckoutResponse | { message?: string; code?: string };

    try {
        responseData = JSON.parse(responseText);
    } catch {
        console.error("[Checkout] Invalid JSON from WooCommerce:", responseText.slice(0, 200));
        return NextResponse.json(
            { error: "Invalid response from payment system." },
            { status: 502 }
        );
    }

    if (!wooResponse.ok) {
        const rawMsg = (responseData as { message?: string }).message || "";
        // If WooCommerce returns HTML (e.g. PHP fatal error from a payment plugin), replace with a friendly message
        const errMsg = rawMsg.includes("<") || rawMsg.includes("wordpress.org")
            ? "This payment method is currently unavailable. Please choose a different payment method or contact support."
            : rawMsg || "Checkout failed. Please try again.";
        console.error(`[Checkout] WooCommerce error ${wooResponse.status}:`, rawMsg);
        return NextResponse.json(
            { error: errMsg },
            { status: wooResponse.status }
        );
    }

    // Success — return the payment redirect URL
    const checkout = responseData as WooCheckoutResponse;
    const redirectUrl = checkout.payment_result?.redirect_url;

    if (!redirectUrl) {
        // Order was created but no redirect needed (e.g., free order)
        return NextResponse.json({
            success: true,
            order_id: checkout.order_id,
            redirect_url: `/order-success?order=${checkout.order_id}`,
        });
    }

    // Do NOT clear cart cookies here — the user may cancel payment and return.
    // WooCommerce clears the cart on its end when payment is confirmed.
    // The cart context will refresh automatically on the order-success page.
    return NextResponse.json({
        success: true,
        order_id: checkout.order_id,
        redirect_url: redirectUrl,
    });
}
