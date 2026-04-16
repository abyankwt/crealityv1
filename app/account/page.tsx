import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";
import { getWooOrders } from "@/lib/woo-client";
import { buildOrderTrackingSummary } from "@/lib/orderTracking";
import DashboardTabs from "@/components/account/DashboardTabs";
import type { WooOrder } from "@/lib/types";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  // Fetch orders server-side so the dashboard renders with data in the first HTML —
  // eliminates the client-side useEffect waterfall (hydrate → fetch → render).
  let initialOrders: WooOrder[] | undefined;
  if (session) {
    try {
      const result = await getWooOrders(session.userId);
      if (result.ok && result.data) {
        initialOrders = result.data.map((order) => ({
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
      }
    } catch {
      // Orders unavailable — OrdersSection will fall back to client fetch
    }
  }

  return (
    <DashboardTabs
      session={session ? { userId: session.userId, email: session.email, name: session.name } : null}
      initialOrders={initialOrders}
    />
  );
}
