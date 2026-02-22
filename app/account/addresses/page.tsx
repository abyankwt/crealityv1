import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/account/LogoutButton";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export default async function AddressesPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? verifySessionToken(sessionToken) : null;

  // Protect the addresses page by requiring a valid session cookie.
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Account
            </p>
            <h1 className="text-3xl font-semibold text-gray-900">Your addresses</h1>
            <p className="text-sm text-gray-500">
              Manage billing and shipping addresses for faster checkout.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
            Address management will appear here once connected.
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Back to dashboard
            </Link>
            <Link
              href="/account/orders"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              View orders
            </Link>
          </div>

          <div className="mt-8">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
