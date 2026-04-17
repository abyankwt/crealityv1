import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess, ERROR_MESSAGES, resolveErrorMessage } from "@/lib/errors";
import { createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE, REMEMBER_ME_MAX_AGE } from "@/lib/auth-session";
import { verifyCustomerPassword, verifyWpUser, updateWooCustomer } from "@/lib/woo-client";
import { verifyPassword, hashPassword } from "@/lib/password";
import type { UserSession } from "@/lib/types";

type LoginPayload = {
  email?: string;
  password?: string;
  rememberMe?: boolean;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Server-side customer lookup cache (per server instance, 10-minute TTL) ──
// Eliminates the WooCommerce REST API round-trip for returning users.
type CachedCustomer = {
  result: Awaited<ReturnType<typeof verifyCustomerPassword>>;
  expiresAt: number;
};
const customerCache = new Map<string, CachedCustomer>();
const CUSTOMER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getCachedCustomer(email: string) {
  const cached = customerCache.get(email);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }
  const result = await verifyCustomerPassword(email);
  customerCache.set(email, { result, expiresAt: Date.now() + CUSTOMER_CACHE_TTL });
  return result;
}

function invalidateCustomerCache(email: string) {
  customerCache.delete(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginPayload;
    if (!body || typeof body !== "object") {
      return NextResponse.json(apiError(ERROR_MESSAGES.badRequest), { status: 400 });
    }
    const email = body?.email?.trim().toLowerCase() ?? "";
    const password = body?.password ?? "";
    const rememberMe = body?.rememberMe === true;

    if (!email || !password || !emailRegex.test(email)) {
      return NextResponse.json(apiError(ERROR_MESSAGES.badRequest), { status: 400 });
    }

    // Look up customer — served from server-side cache for returning users (no WooCommerce round-trip)
    const customerResult = await getCachedCustomer(email);
    if (!customerResult) {
      console.log(`[Login] No customer found for email: ${email}`);
      return NextResponse.json(apiError(ERROR_MESSAGES.invalidCredentials), { status: 401 });
    }

    const { customer, storedHash } = customerResult;
    console.log(`[Login] customer id=${customer.id} hasHash=${!!storedHash}`);

    if (storedHash) {
      // Accounts registered via the app — verify against stored hash (instant, no network)
      const hashMatch = verifyPassword(password, storedHash);
      if (!hashMatch) {
        // Wrong password — don't cache wrong credentials, but keep customer data cached
        return NextResponse.json(apiError(ERROR_MESSAGES.invalidCredentials), { status: 401 });
      }
    } else {
      // Pre-existing WooCommerce account (no hash) — verify against WordPress directly
      console.log(`[Login] No stored hash for customer ${customer.id}, falling back to WP auth`);
      const wpAuth = await verifyWpUser(email, password, {
        id: customer.id,
        username: customer.username || email,
        name: `${customer.first_name} ${customer.last_name}`.trim() || email,
        email: customer.email,
      });
      if (!wpAuth.ok) {
        return NextResponse.json(apiError(ERROR_MESSAGES.invalidCredentials), { status: 401 });
      }
      // Save hash so future logins skip WordPress entirely — also invalidate cache so
      // next login reads the new hash from WooCommerce.
      invalidateCustomerCache(email);
      void updateWooCustomer(customer.id, {
        meta_data: [{ key: "app_password_hash", value: hashPassword(password) }],
      });
    }

    const session: UserSession = {
      userId: customer.id,
      name: `${customer.first_name} ${customer.last_name}`.trim() || email,
      email: customer.email,
    };

    const sessionToken = await createSession(session);
    const res = NextResponse.json(apiSuccess(session));
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: rememberMe ? REMEMBER_ME_MAX_AGE : SESSION_MAX_AGE,
    });

    return res;
  } catch (error) {
    const message = resolveErrorMessage(error, ERROR_MESSAGES.serverError);
    return NextResponse.json(apiError(message), { status: 500 });
  }
}
