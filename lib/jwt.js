import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "rentora_super_secret_jwt_key_2026_fallback";
const key = new TextEncoder().encode(JWT_SECRET);

export const AUTH_COOKIE_NAME = "rentora_token";

/**
 * Sign a JWT token with the given payload
 * @param {object} payload - User information { id, email, role, name, ... }
 * @param {string} expiresIn - Expiry string, default "7d"
 * @returns {Promise<string>}
 */
export async function signToken(payload, expiresIn = "7d") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {Promise<object|null>}
 */
export async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Standard HTTP-only cookie options for session security
 */
export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}
