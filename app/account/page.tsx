import { Suspense } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";
import { getWooOrders } from "@/lib/woo-client";
import { buildOrderTrackingSummary } from "@/lib/orderTracking";
import DashboardTabs from "@/components/account/DashboardTabs";
import OrdersSection from "@/components/account/OrdersSection";
import type { WooOrder } from "@/lib/types";

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-5">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="mt-3 h-5 w-32 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-40 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

async function OrdersFromServer({ userId }: { userId: number }) {
  const result = await getWooOrders(userId);
  let initialOrders: WooOrder[] | undefined;
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
  return <OrdersSection initialOrders={initialOrders} />;
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  // Dashboard shell renders immediately (session check only).
  // Orders stream in server-side via Suspense — no client-side waterfall.
  const ordersContent = session ? (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersFromServer userId={session.userId} />
    </Suspense>
  ) : (
    <OrdersSection />
  );

  return (
    <DashboardTabs
      session={session ? { userId: session.userId, email: session.email, name: session.name } : null}
      ordersContent={ordersContent}
    />
  );
}
