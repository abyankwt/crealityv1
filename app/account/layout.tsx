import type { ReactNode } from "react";
import AccountSidebar from "@/components/account/AccountSidebar";

type AccountLayoutProps = {
  children: ReactNode;
};

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Account Center
          </p>
          <h1 className="text-3xl font-semibold text-gray-900">Your Creality profile</h1>
          <p className="text-sm text-gray-500">
            Review orders, manage saved addresses, and keep your account up to date.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="hidden md:block">
            <AccountSidebar />
          </div>
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
