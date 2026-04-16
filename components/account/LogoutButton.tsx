"use client";

import { useState } from "react";

type Props = {
  fullWidth?: boolean;
  label?: string;
};

export default function LogoutButton({ fullWidth = false, label = "Logout" }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);
    setIsLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      try { sessionStorage.removeItem("auth_me_cache"); } catch { /* ignore */ }
      window.location.href = "/";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign out.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className={`inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70 ${fullWidth ? "w-full" : ""}`}
      >
        {isLoading ? "Signing out..." : label}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
