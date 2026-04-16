import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess, ERROR_MESSAGES, resolveErrorMessage } from "@/lib/errors";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";
import { buildOrderTrackingSummary } from "@/lib/orderTracking";
import { getWooOrders } from "@/lib/woo-client";
import type { WooOrder } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });
    }

    const response = await getWooOrders(session.userId);
    if (!response.ok || !response.data) {
      return NextResponse.json(apiError(ERROR_MESSAGES.serviceUnavailable), {
        status: response.status || 502,
      });
    }

    const orders: WooOrder[] = response.data.map((order) => ({
      id: order.id,
      status: order.status,
      date_created: order.date_created,
      date: order.date_created,
      total: order.total,
      currency: order.currency,
      line_items: order.line_items?.map((item) => ({
        id: item.id,
        name: item.name,
        product_id: item.product_id,
        quantity: item.quantity,
        subtotal: item.subtotal,
        total: item.total,
        price: item.price,
        image: item.image,
      })),
      billing: order.billing,
      shipping: order.shipping,
      payment_method_title: order.payment_method_title,
      tracking: buildOrderTrackingSummary({
        date_created: order.date_created,
        status: order.status,
        products: [],
      }),
    }));

    const res = NextResponse.json(apiSuccess(orders));
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    const message = resolveErrorMessage(error, ERROR_MESSAGES.serverError);
    return NextResponse.json(apiError(message), { status: 500 });
  }
}
