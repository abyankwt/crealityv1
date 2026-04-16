import { NextResponse, type NextRequest } from "next/server";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";

type AuthenticatedUser = {
  id: number;
  email: string;
  name: string;
};

type AuthResponse =
  | { authenticated: false }
  | { authenticated: true; user: AuthenticatedUser };

type JwtSessionPayload = JwtPayload & {
  id?: number | string;
  userId?: number | string;
  email?: string;
  name?: string;
};

const unauthenticated = (): NextResponse<AuthResponse> =>
  NextResponse.json({ authenticated: false }, { status: 200 });

const parseUserId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const num = Number(value);
    if (Number.isInteger(num) && num > 0) {
      return num;
    }
  }
  return null;
};

const parseJwtUser = (token: string, secret: string): AuthenticatedUser | null => {
  try {
    const decoded = jwt.verify(token, secret) as JwtSessionPayload | string;
    if (!decoded || typeof decoded === "string") {
      console.error("[auth/me] JWT payload is invalid.");
      return null;
    }

    const id = parseUserId(decoded.id ?? decoded.userId ?? decoded.sub);
    const email = typeof decoded.email === "string" ? decoded.email.trim() : "";
    const name = typeof decoded.name === "string" ? decoded.name.trim() : "";

    if (!id || !email || !name) {
      console.error("[auth/me] JWT missing required user fields.");
      return null;
    }

    return { id, email, name };
  } catch (error) {
    console.error("[auth/me] JWT verification failed:", error);
    return null;
  }
};

export async function GET(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const sessionSecret = process.env.SESSION_SECRET?.trim();
    const wordpressUrl =
      process.env.WORDPRESS_URL?.trim() || process.env.WC_BASE_URL?.trim();

    if (!sessionSecret || !wordpressUrl) {
      console.error("[auth/me] Missing required env vars.", {
        hasSessionSecret: Boolean(sessionSecret),
        hasWordpressUrl: Boolean(wordpressUrl),
      });
      return unauthenticated();
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      console.error("[auth/me] Missing session cookie.");
      return unauthenticated();
    }

    const tokenSegments = token.split(".").length;

    // JWT flow
    if (tokenSegments === 3) {
      const jwtUser = parseJwtUser(token, sessionSecret);
      if (!jwtUser) {
        return unauthenticated();
      }
      const jwtRes = NextResponse.json(
        { authenticated: true, user: jwtUser },
        { status: 200 }
      );
      jwtRes.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
      return jwtRes;
    }

    // Legacy HMAC-signed session flow
    if (tokenSegments === 2) {
      try {
        const session = await verifySession(token);
        if (!session) {
          console.error("[auth/me] Legacy session verification failed.");
          return unauthenticated();
        }

        const legacyRes = NextResponse.json(
          {
            authenticated: true,
            user: {
              id: session.userId,
              email: session.email,
              name: session.name,
            },
          },
          { status: 200 }
        );
        legacyRes.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
        return legacyRes;
      } catch (error) {
        console.error("[auth/me] Legacy session verification threw:", error);
        return unauthenticated();
      }
    }

    console.error("[auth/me] Unsupported session token format.");
    return unauthenticated();
  } catch (error) {
    console.error("[auth/me] Unexpected error:", error);
    return unauthenticated();
  }
}
