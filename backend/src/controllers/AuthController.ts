import { Context } from "hono";
import { D1Adapter } from "../config/d1";
import AppError from "../errors/AppError";
import { createToken, createRefreshToken } from "../helpers/TokenManager";
import bcrypt from "bcryptjs";

// Login
export const login = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const db = new D1Adapter(c.env.DB);

    // Find user by email
    const user = await db.findOne("users", { email });

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    // Create tokens
    const token = await createToken({
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      profile: user.profile
    });

    const refreshToken = await createRefreshToken({
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      profile: user.profile
    });

    // Update user online status
    await db.update("users", { online: true }, { id: user.id });

    // Remove sensitive data
    const { password: _, ...safeUser } = user;

    return c.json(
      {
        user: safeUser,
        token,
        refreshToken
      },
      200
    );
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    console.error("Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
};

// Logout
export const logout = async (c: Context) => {
  try {
    const user = c.get("user");

    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    const db = new D1Adapter(c.env.DB);

    // Update user online status
    await db.update("users", { online: false }, { id: user.id });

    return c.json({ message: "Logged out successfully" }, 200);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    console.error("Logout error:", error);
    return c.json({ error: "Logout failed" }, 500);
  }
};

// Refresh token
export const refreshToken = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      throw new AppError("Refresh token is required", 400);
    }

    const { verifyToken } = await import("../helpers/TokenManager");
    const payload = await verifyToken(refreshToken);

    if (!payload) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Create new access token
    const { createToken: ct } = await import("../helpers/TokenManager");
    const newToken = await ct({
      id: payload.id,
      email: payload.email,
      companyId: payload.companyId,
      profile: payload.profile
    });

    return c.json(
      {
        token: newToken
      },
      200
    );
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    console.error("Token refresh error:", error);
    return c.json({ error: "Token refresh failed" }, 500);
  }
};

// Signup (create account)
export const signup = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password, name, companyName } = body;

    if (!email || !password || !name || !companyName) {
      throw new AppError("Email, password, name and company name are required", 400);
    }

    const db = new D1Adapter(c.env.DB);

    // Check if email already exists
    const existingUser = await db.findOne("users", { email });
    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    // Create company
    const company = {
      name: companyName,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Since D1 doesn't return the inserted ID easily, we need a workaround
    // For now, we'll insert and then query back
    await db.insert("companies", company);
    const createdCompany = await db.findOne("companies", {
      name: companyName
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user as admin of their own company
    const user = {
      name,
      email,
      password: hashedPassword,
      profile: "admin",
      companyId: createdCompany.id,
      online: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert("users", user);
    const createdUser = await db.findOne("users", { email });

    // Create tokens
    const token = await createToken({
      id: createdUser.id,
      email: createdUser.email,
      companyId: createdUser.companyId,
      profile: createdUser.profile
    });

    const refreshToken = await createRefreshToken({
      id: createdUser.id,
      email: createdUser.email,
      companyId: createdUser.companyId,
      profile: createdUser.profile
    });

    const { password: _, ...safeUser } = createdUser;

    return c.json(
      {
        user: safeUser,
        company: createdCompany,
        token,
        refreshToken
      },
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    console.error("Signup error:", error);
    return c.json({ error: "Signup failed" }, 500);
  }
};
