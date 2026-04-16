const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30;

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE, REMEMBER_ME_MAX_AGE };

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
};

const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET");
  }
  return secret;
};

const textEncoder = new TextEncoder();

const hasBuffer = typeof Buffer !== "undefined";

const base64UrlEncodeBytes = (input: Uint8Array) => {
  const base64 = hasBuffer
    ? Buffer.from(input).toString("base64")
    : btoa(String.fromCharCode(...input));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64UrlEncodeString = (input: string) => {
  return base64UrlEncodeBytes(textEncoder.encode(input));
};

const base64UrlDecodeBytes = (input: string) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  if (hasBuffer) {
    return new Uint8Array(Buffer.from(padded, "base64"));
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const base64UrlDecodeString = (input: string) => {
  const bytes = base64UrlDecodeBytes(input);
  return new TextDecoder().decode(bytes);
};

const safeEqual = (a: string, b: string) => {
  const aBytes = textEncoder.encode(a);
  const bBytes = textEncoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let result = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
};

const sign = async (payload: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));
  return base64UrlEncodeBytes(new Uint8Array(signature));
};

const isValidPayload = (payload: unknown): payload is SessionPayload => {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.userId === "number" &&
    Number.isFinite(candidate.userId) &&
    typeof candidate.email === "string" &&
    candidate.email.length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.length > 0
  );
};

export const createSession = async (payload: SessionPayload) => {
  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload));
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

export const verifySession = async (cookieValue: string) => {
  const [encodedPayload, signature] = cookieValue.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await sign(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecodeString(encodedPayload);
    const payload = JSON.parse(payloadJson) as unknown;
    return isValidPayload(payload) ? payload : null;
  } catch {
    return null;
  }
};

export const destroySession = () => ({
  name: SESSION_COOKIE_NAME,
  value: "",
  options: {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  },
});
