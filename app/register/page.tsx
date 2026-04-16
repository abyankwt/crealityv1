"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useRef, type FormEvent } from "react";
import { Suspense } from "react";
import { Eye, EyeOff } from "lucide-react";

type RegisterResponse =
  | { success: true; data: { userId: number; name: string; email: string } }
  | { success: false; error: string };

const AUTH_CACHE_KEY = "auth_me_cache";

const getSafeRedirect = (redirect: string | null): string => {
  if (!redirect) return "/account";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/account";
  return redirect;
};

const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const emailError = emailTouched && email.length > 0 && !isEmailValid(email)
    ? "Enter a valid email address"
    : null;

  const passwordStrength = password.length === 0
    ? null
    : password.length < 8
      ? "weak"
      : password.length < 12
        ? "fair"
        : "strong";

  const strengthColor =
    passwordStrength === "weak" ? "bg-red-400" :
    passwordStrength === "fair" ? "bg-yellow-400" :
    passwordStrength === "strong" ? "bg-green-500" : "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isEmailValid(email)) {
      setEmailTouched(true);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = (await response.json()) as RegisterResponse;

      if (!response.ok || !data.success) {
        setError(!data.success ? data.error : "Registration failed. Please try again.");
        return;
      }

      // Write auth cache so Navbar shows the name instantly on redirect
      try {
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
          data: { authenticated: true, user: data.data },
          ts: Date.now(),
        }));
      } catch { /* sessionStorage unavailable */ }

      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Join Creality Kuwait to start shopping
          </p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Full name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                ref={nameRef}
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition"
                placeholder="Name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                onBlur={() => setEmailTouched(true)}
                className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition ${
                  emailError ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-black"
                }`}
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-500">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${strengthColor}`}
                      style={{
                        width: passwordStrength === "weak" ? "33%" : passwordStrength === "fair" ? "66%" : "100%",
                      }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium capitalize ${
                    passwordStrength === "weak" ? "text-red-500" :
                    passwordStrength === "fair" ? "text-yellow-600" : "text-green-600"
                  }`}>
                    {passwordStrength}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition ${
                    confirmPassword.length > 0 && confirmPassword !== password
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-black"
                  }`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href={`/login${redirectTo !== "/account" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-semibold text-black hover:text-gray-700 transition"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm animate-pulse space-y-5">
            <div className="h-6 w-32 rounded bg-gray-100" />
            <div className="h-4 w-52 rounded bg-gray-100" />
            <div className="space-y-3 pt-2">
              <div className="h-10 w-full rounded-lg bg-gray-100" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
