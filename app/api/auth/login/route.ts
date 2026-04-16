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

    // Look up customer and check for stored hash
    const customerResult = await verifyCustomerPassword(email);
    if (!customerResult) {
      console.log(`[Login] No customer found for email: ${email}`);
      return NextResponse.json(apiError(ERROR_MESSAGES.invalidCredentials), { status: 401 });
    }

    const { customer, storedHash } = customerResult;
    console.log(`[Login] customer id=${customer.id} hasHash=${!!storedHash} hashValue=${storedHash ?? "null"}`);

    if (storedHash) {
      // Accounts registered via the app — verify against stored hash
      const hashMatch = verifyPassword(password, storedHash);
      console.log(`[Login] verifyPassword result=${hashMatch}`);
      if (!hashMatch) {
        console.log(`[Login] Password mismatch for customer ${customer.id}`);
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
      console.log(`[Login] WP auth result ok=${wpAuth.ok} status=${wpAuth.status}`);
      if (!wpAuth.ok) {
        return NextResponse.json(apiError(ERROR_MESSAGES.invalidCredentials), { status: 401 });
      }
      // Save hash so future logins skip WordPress entirely (fire-and-forget)
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
