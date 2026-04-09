import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess, ERROR_MESSAGES, resolveErrorMessage } from "@/lib/errors";
import { createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth-session";
import { createWooCustomer, updateWooCustomer } from "@/lib/woo-client";
import { hashPassword } from "@/lib/password";
import type { UserSession } from "@/lib/types";

type RegisterPayload = {
  name?: string;
  email?: string;
  password?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() ?? "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
};

const usernameFromEmail = (email: string) =>
  email.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "") || email;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterPayload;
    if (!body || typeof body !== "object") {
      return NextResponse.json(apiError(ERROR_MESSAGES.badRequest), { status: 400 });
    }
    const name = body?.name?.trim() ?? "";
    const email = body?.email?.trim().toLowerCase() ?? "";
    const password = body?.password ?? "";

    if (!name || !email || !password || !emailRegex.test(email) || password.length < 8) {
      return NextResponse.json(apiError(ERROR_MESSAGES.badRequest), { status: 400 });
    }

    const { firstName, lastName } = splitName(name);
    const response = await createWooCustomer({
      email,
      first_name: firstName,
      last_name: lastName,
      username: usernameFromEmail(email),
      password,
    });

    if (!response.ok || !response.data?.id) {
      const message =
        response.status >= 500
          ? ERROR_MESSAGES.serviceUnavailable
          : (!response.ok && response.errorMessage)
            ? response.errorMessage
            : ERROR_MESSAGES.registrationFailed;
      return NextResponse.json(apiError(message), {
        status: response.status || 400,
      });
    }

    // Store password hash so login can verify without relying on wp-login.php
    const passwordHash = hashPassword(password);
    const hashResult = await updateWooCustomer(response.data.id, {
      meta_data: [{ key: "app_password_hash", value: passwordHash }],
    });
    console.log(`[Register] hash storage for customer ${response.data.id}: ok=${hashResult.ok} status=${hashResult.status}${!hashResult.ok && hashResult.errorMessage ? ` err=${hashResult.errorMessage}` : ""}`);

    const session: UserSession = {
      userId: response.data.id,
      name,
      email,
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
      maxAge: SESSION_MAX_AGE,
    });

    return res;
  } catch (error) {
    const message = resolveErrorMessage(error, ERROR_MESSAGES.registrationFailed);
    return NextResponse.json(apiError(message), { status: 500 });
  }
}
