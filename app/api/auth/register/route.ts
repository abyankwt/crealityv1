import { NextResponse, type NextRequest } from "next/server";
import { getWpApiUrl, getAdminAuthHeader } from "@/lib/wp";

type RegisterPayload = {
  name?: string;
  email?: string;
  password?: string;
};

type WooCustomerResponse = {
  id?: number;
  email?: string;
  username?: string;
  message?: string;
  code?: string;
};

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() ?? "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
};

const usernameFromEmail = (email: string) => {
  return email.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "") || email;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterPayload;
    const name = body?.name?.trim() ?? "";
    const email = body?.email?.trim().toLowerCase() ?? "";
    const password = body?.password ?? "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const { firstName, lastName } = splitName(name);
    const apiUrl = getWpApiUrl();
    const authHeader = getAdminAuthHeader();

    // Create WooCommerce customer via REST API using admin Application Password.
    const response = await fetch(`${apiUrl}/wp-json/wc/v3/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        username: usernameFromEmail(email),
        password,
        role: "customer",
      }),
      cache: "no-store",
    });

    const data = (await response.json()) as WooCustomerResponse;

    if (!response.ok || !data?.id) {
      return NextResponse.json(
        { error: data?.message ?? "Registration failed." },
        { status: response.status || 400 }
      );
    }

    return NextResponse.json({ success: true, customerId: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
