/**
 * Server-only session helper.
 * ✅ Safe to import in: Route Handlers, Server Components, Server Actions.
 * ❌ NEVER import this in Client Components or hooks — it uses next/headers.
 */

import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE_NAME } from "./jwt";

/**
 * Reads the JWT cookie and returns the verified session payload.
 * Returns null if not authenticated or token is invalid.
 * @returns {Promise<object|null>}
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}
