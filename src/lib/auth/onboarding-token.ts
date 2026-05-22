import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * HMAC-SHA256 signed, base64url-encoded payload + signature, joined by ".".
 *
 * Two token shapes:
 *   - "first_login":     gates /onboarding/set-password for a user whose
 *                        needs_password_set is still true.
 *   - "login_continue":  short-lived continuation carrying the resolved
 *                        email between the Continue step and the password
 *                        submission step on /login. Avoids leaking the
 *                        underlying email back to the browser.
 *
 * Server-only. Do NOT import from a "use client" module.
 */

function getSecret(): string {
  const secret = process.env.ONBOARDING_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      "ONBOARDING_TOKEN_SECRET is not set. Add it to .env.local — see CLAUDE.md §9 'Required env vars'.",
    );
  }
  return secret;
}

export type TokenType = "first_login" | "login_continue";
export type Role = "tenant" | "admin" | "manager" | "dr";

export interface TokenPayload {
  type: TokenType;
  uid: string;
  email: string;
  role: Role;
  exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

export function signToken(
  payload: Omit<TokenPayload, "exp">,
  ttlSeconds = 600,
): string {
  const full: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = b64url(JSON.stringify(full));
  const sig = createHmac("sha256", getSecret()).update(body).digest();
  return `${body}.${b64url(sig)}`;
}

export function verifyToken(
  token: string,
  expectedType: TokenType,
): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  const expected = createHmac("sha256", getSecret()).update(body).digest();
  const provided = fromB64url(sig);
  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }

  if (payload.type !== expectedType) return null;
  if (typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}
