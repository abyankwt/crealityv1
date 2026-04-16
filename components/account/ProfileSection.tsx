"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserSession } from "@/lib/types";
import LogoutButton from "./LogoutButton";

type Props = {
    session: UserSession | null;
};

export default function ProfileSection({ session }: Props) {
    const [phone, setPhone] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/account/customer", { cache: "no-store" })
            .then((r) => r.json())
            .then((body: { success: boolean; data?: { billing?: { phone?: string }; shipping?: { phone?: string } } }) => {
                if (!body.success) return;
                // Prefer billing phone, fall back to shipping phone
                const resolved =
                    body.data?.billing?.phone?.trim() ||
                    body.data?.shipping?.phone?.trim() ||
                    "";
                setPhone(resolved || null);
            })
            .catch(() => null);
    }, []);

    return (
        <div className="space-y-4">
            {/* Info grid */}
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Name</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{session?.name ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Email</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{session?.email ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Phone</p>
                    {phone ? (
                        <p className="mt-1 text-sm font-semibold text-gray-900">{phone}</p>
                    ) : (
                        <p className="mt-1 text-sm text-gray-400">
                            Not set —{" "}
                            <Link href="/account/addresses" className="text-black underline hover:no-underline">
                                add phone
                            </Link>
                        </p>
                    )}
                </div>
            </div>

            {/* Quick links */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">Quick Links</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                        href="/account/addresses"
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Manage Addresses
                    </Link>
                    <Link
                        href="/account/orders"
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        View All Orders
                    </Link>
                </div>
            </div>

            {/* Sign out */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">Logout</p>
                <p className="mt-1 text-xs text-gray-500">Sign out of your account</p>
                <div className="mt-3">
                    <LogoutButton fullWidth />
                </div>
            </div>
        </div>
    );
}
