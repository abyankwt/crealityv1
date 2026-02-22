import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "auth_token";

export type SessionUser = {
  id: number;
  name: string;
  email?: string;
  username?: string;
};

type SessionPayload = SessionUser & { iat: number };

const getSessionSecret = () => {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SESSION_SECRET");
  }
  return secret;
};

const base64UrlEncode = (input: string) => {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const base64UrlDecode = (input: string) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf-8");
};

const sign = (payload: string, secret: string) => {
  return createHmac("sha256", secret).update(payload).digest("base64url");
};

export const createSessionToken = (user: SessionUser) => {
  const payload: SessionPayload = { ...user, iat: Date.now() };
  const payloadJson = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadJson);
  const signature = sign(encodedPayload, getSessionSecret());
  return `${encodedPayload}.${signature}`;
};

export const verifySessionToken = (token: string): SessionPayload | null => {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload, getSessionSecret());
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) {
    return null;
  }
  if (!timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload);
    return JSON.parse(payloadJson) as SessionPayload;
  } catch {
    return null;
  }
};
