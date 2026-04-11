"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function OrderSuccessPage() {
  useEffect(() => {
    sessionStorage.removeItem("creality_cart_backup");
  }, []);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Order successfully placed!
        </h1>
        <p className="mb-8 text-sm text-gray-600">
          Thank you for shopping with Creality Kuwait. We've received your order
          and will begin processing it right away.
        </p>
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/store"
            className="flex w-full items-center justify-center rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
          <Link
            href="/account/orders"
            className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-black"
          >
            View Orders
          </Link>
        </div>
      </div>
    </main>
  );
}
