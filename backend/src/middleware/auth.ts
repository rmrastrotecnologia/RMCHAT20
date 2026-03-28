import { Context, Next } from "hono";
import { getTokenFromHeader, verifyToken } from "../helpers/TokenManager";
import AppError from "../errors/AppError";

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header("Authorization");
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      throw new AppError("Missing authorization token", 401);
    }

    const payload = await verifyToken(token);

    if (!payload) {
      throw new AppError("Invalid token", 401);
    }

    // Store user info in context
    c.set("user", payload);

    await next();
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    return c.json({ error: "Unauthorized" }, 401);
  }
}

export function requireAuth(c: Context): any {
  const user = c.get("user");

  if (!user) {
    throw new AppError("Unauthorized", 401);
  }

  return user;
}

export function requireRole(role: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user || user.profile !== role) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    await next();
  };
}

export function requireCompanyAccess(c: Context, companyId: number): boolean {
  const user = c.get("user");

  if (!user) {
    return false;
  }

  // Admin can access any company
  if (user.profile === "admin") {
    return true;
  }

  // User can only access their own company
  return user.companyId === companyId;
}
