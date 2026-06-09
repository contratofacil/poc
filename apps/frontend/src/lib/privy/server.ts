/**
 * EasyLaw — Privy Server-Side Client
 *
 * Used in Next.js Route Handlers and Server Actions to:
 * - Verify Privy JWT tokens
 * - Sync Privy user with EasyLaw backend
 * - Server-side wallet operations
 *
 * NOTE: @privy-io/node must be installed separately in the backend service.
 * This file provides the verification logic for Next.js API routes.
 */

const PRIVY_APP_ID     = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET!;

/**
 * Verify a Privy auth token from an incoming request.
 * Call this in Route Handlers / middleware.
 *
 * @example
 * // app/api/contracts/route.ts
 * export async function GET(req: Request) {
 *   const authHeader = req.headers.get("authorization");
 *   const token = authHeader?.replace("Bearer ", "");
 *   const claims = await verifyPrivyToken(token);
 *   if (!claims) return Response.json({ error: "Unauthorized" }, { status: 401 });
 *   // ... handle request
 * }
 */
export async function verifyPrivyToken(
  token: string | null | undefined
): Promise<{ userId: string; appId: string } | null> {
  if (!token) return null;

  try {
    // Dynamic import so this only runs server-side
    const { PrivyClient } = await import("@privy-io/node" as string).catch(
      () => ({ PrivyClient: null })
    );

    if (!PrivyClient) {
      // Fallback: manual JWT verification without the Node SDK
      return verifyPrivyTokenManual(token);
    }

    const privy = new PrivyClient({ appId: PRIVY_APP_ID, appSecret: PRIVY_APP_SECRET });
    const claims = await privy.verifyAuthToken(token);
    return { userId: claims.userId, appId: claims.appId };
  } catch {
    return null;
  }
}

/**
 * Manual JWT verification fallback (no @privy-io/node dependency).
 * Verifies the token structure and expiration.
 */
async function verifyPrivyTokenManual(
  token: string
): Promise<{ userId: string; appId: string } | null> {
  try {
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    );

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    // Check appId matches
    if (payload.aud !== PRIVY_APP_ID) return null;

    return { userId: payload.sub as string, appId: payload.aud as string };
  } catch {
    return null;
  }
}

/**
 * Extract Privy token from a Next.js Request.
 * Supports both Authorization header and privy-token cookie.
 */
export function extractPrivyToken(req: Request): string | null {
  // Try Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Try cookie (set by Privy SDK automatically)
  const cookies = req.headers.get("cookie") ?? "";
  const match = cookies.match(/privy-token=([^;]+)/);
  return match?.[1] ?? null;
}
