import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { getAdminAuthHeader, getWpApiUrl } from "@/lib/wp";

type WpUserResponse = {
  id: number;
  name: string;
  email?: string;
  slug?: string;
  username?: string;
  message?: string;
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const apiUrl = getWpApiUrl();
    const authHeader = getAdminAuthHeader();

    // Fetch the latest user data from WordPress using admin Application Password.
    const response = await fetch(`${apiUrl}/wp-json/wp/v2/users/${session.id}?context=edit`, {
      headers: {
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ authenticated: true, user: session });
    }

    const user = (await response.json()) as WpUserResponse;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username ?? user.slug,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to validate session.";
    return NextResponse.json({ authenticated: false, error: message }, { status: 500 });
  }
}
