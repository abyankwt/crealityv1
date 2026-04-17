"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { Suspense } from "react";
import { Eye, EyeOff } from "lucide-react";

type LoginResponse =
  | { success: true; data: { userId: number; name: string; email: string } }
  | { success: false; error: string };

const EMAIL_KEY = "creality_last_email";
const AUTH_CACHE_KEY = "auth_me_cache";
const AUTH_CACHE_TTL = 5 * 60 * 1000;

const getSafeRedirect = (redirect: string | null): string => {
  if (!redirect) return "/account";
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return "/account";
  return redirect;
};

const isEmailValid = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Instantly redirect if already authenticated — same as Amazon's behaviour
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: { authenticated: boolean }; ts: number };
        if (parsed?.data?.authenticated && Date.now() - parsed.ts < AUTH_CACHE_TTL) {
          router.replace(redirectTo);
          return;
        }
      }
    } catch { /* sessionStorage unavailable */ }

    // Prefetch the destination so navigation after login is instant
    router.prefetch(redirectTo);

    // Restore remembered email
    try {
      const saved = localStorage.getItem(EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch { /* localStorage unavailable */ }

    // Focus the appropriate field
    emailRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isEmailValid(email)) {
      setEmailTouched(true);
      emailRef.current?.focus();
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.success) {
        setError(!data.success ? data.error : "Login failed. Please check your credentials.");
        return;
      }

      // Write auth cache immediately so Navbar shows name without waiting for /api/auth/me
      try {
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
          data: { authenticated: true, user: data.data },
          ts: Date.now(),
        }));
      } catch { /* sessionStorage unavailable */ }

      // Remember email for next visit
      try {
        localStorage.setItem(EMAIL_KEY, email);
      } catch { /* localStorage unavailable */ }

      // Full navigation so the browser sends the new session cookie and middleware reads it fresh
      window.location.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const emailError = emailTouched && email.length > 0 && !isEmailValid(email)
    ? "Enter a valid email address"
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back to Creality Kuwait
          </p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                ref={emailRef}
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
                  emailError
                    ? "border-red-300 focus:ring-red-400"
                    : "border-gray-200 focus:ring-black"
                }`}
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-500">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-gray-500 hover:text-gray-700 transition"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Keep me signed in */}
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-black"
              />
              <span className="text-sm text-gray-600">Keep me signed in</span>
            </label>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-600">
          New to Creality Kuwait?{" "}
          <Link
            href={`/register${redirectTo !== "/account" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-semibold text-black hover:text-gray-700 transition"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm animate-pulse space-y-5">
            <div className="h-6 w-20 rounded bg-gray-100" />
            <div className="h-4 w-48 rounded bg-gray-100" />
            <div className="space-y-3 pt-2">
              <div className="h-10 w-full rounded-lg bg-gray-100" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
              <div className="h-4 w-32 rounded bg-gray-100" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
