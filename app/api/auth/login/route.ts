import { NextResponse, type NextRequest } from "next/server";
import { getWpApiUrl } from "@/lib/wp";
import { createSessionToken, SESSION_COOKIE_NAME, type SessionUser } from "@/lib/session";

type LoginPayload = {
  username?: string;
  email?: string;
  password?: string;
};

type WpUserResponse = {
  id: number;
  name: string;
  email?: string;
  slug?: string;
  username?: string;
  message?: string;
};

const getIdentifier = (payload: LoginPayload) => {
  return payload.username?.trim() || payload.email?.trim() || "";
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginPayload;
    const identifier = getIdentifier(body);
    const password = body?.password ?? "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required." },
        { status: 400 }
      );
    }

    const apiUrl = getWpApiUrl();
    const basicToken = Buffer.from(`${identifier}:${password}`).toString("base64");

    // Verify user credentials against WordPress.
    const response = await fetch(`${apiUrl}/wp-json/wp/v2/users/me?context=edit`, {
      headers: {
        Authorization: `Basic ${basicToken}`,
      },
      cache: "no-store",
    });

    const data = (await response.json()) as WpUserResponse;

    if (!response.ok || !data?.id) {
      return NextResponse.json(
        { error: data?.message ?? "Invalid credentials." },
        { status: 401 }
      );
    }

    const sessionUser: SessionUser = {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username ?? data.slug,
    };

    const sessionToken = createSessionToken(sessionUser);
    const res = NextResponse.json({ success: true, user: sessionUser });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
