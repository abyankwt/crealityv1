import { NextResponse, type NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const forwardRequest = async (
  request: NextRequest,
  path: string[]
): Promise<NextResponse> => {
  try {
    const baseUrl = process.env.WC_BASE_URL;
    if (!baseUrl) {
      throw new Error("WC_BASE_URL environment variable is not set.");
    }

    const url = `${baseUrl}/wp-json/wc/store/${path.join("/")}`;
    const headers = new Headers();
    const cookie = request.headers.get("cookie");

    if (cookie) {
      headers.set("cookie", cookie);
    }

    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer();

    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
    });

    const responseBody = await response.arrayBuffer();
    const nextHeaders = new Headers();
    const setCookie = response.headers.get("set-cookie");
    const contentType = response.headers.get("content-type");

    if (setCookie) {
      nextHeaders.set("set-cookie", setCookie);
    }
    if (contentType) {
      nextHeaders.set("content-type", contentType);
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: nextHeaders,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown proxy error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { path } = await context.params;
  const safePath = path ?? [];
  return forwardRequest(request, safePath);
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { path } = await context.params;
  const safePath = path ?? [];
  return forwardRequest(request, safePath);
}
