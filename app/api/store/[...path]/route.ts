import { NextResponse, type NextRequest } from "next/server";

const getStoreApiUrl = (path: string) => {
  const baseUrl = process.env.WC_BASE_URL;
  if (!baseUrl) {
    throw new Error("WC_BASE_URL environment variable is not set.");
  }
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}/wp-json/wc/store/v1/${path}`;
};

const forwardRequest = async (request: NextRequest, path: string[]) => {
  try {
    const url = getStoreApiUrl(path.join("/"));
    const headers = new Headers();
    const cookie = request.headers.get("cookie");
    const contentType = request.headers.get("content-type");

    if (cookie) {
      headers.set("cookie", cookie);
    }
    if (contentType) {
      headers.set("content-type", contentType);
    }
    headers.set("accept", "application/json");

    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer();

    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
    });

    const text = await response.text();
    let data: unknown = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown proxy error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return forwardRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return forwardRequest(request, path);
}
