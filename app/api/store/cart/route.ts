import { type NextRequest, NextResponse } from "next/server";
import { proxyToWooStore } from "@/lib/wc-store-proxy";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyToWooStore("cart", request);
}