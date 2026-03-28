import { Context } from "hono";
import { D1Adapter } from "../config/d1";
import AppError from "../errors/AppError";
import { User, ApiResponse } from "../models";
import { requireAuth, requireRole, requireCompanyAccess } from "../middleware/auth";
import bcrypt from "bcryptjs";

// List users with pagination
export const index = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    const searchParam = c.req.query("searchParam") || "";
    const pageNumber = parseInt(c.req.query("pageNumber") || "0");
    const pageSize = 20;
    const offset = pageNumber * pageSize;

    const db = new D1Adapter(c.env.DB);

    // Build search query
    let whereClause = "WHERE companyId = ?";
    let params: any[] = [user.companyId];

    if (searchParam) {
      whereClause += " AND (name LIKE ? OR email LIKE ?)";
      params.push(`%${searchParam}%`, `%${searchParam}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM users ${whereClause}`;
    const countResult = await db.execute(countQuery, params);
    const count = countResult[0]?.count || 0;

    // Get paginated results
    const query = `
      SELECT * FROM users 
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `;
    params.push(pageSize, offset);
    const users = await db.execute(query, params);

    const hasMore = offset + pageSize < count;

    return c.json({ users, count, hasMore });
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    return c.json({ error: "Failed to list users" }, 500);
  }
};

// Create new user
export const store = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    const body = await c.req.json();
    const {
      email,
      password,
      name,
      profile,
      companyId: bodyCompanyId,
      queueIds,
      whatsappId,
      allTicket
    } = body;

    // Validate required fields
    if (!email || !password || !name) {
      throw new AppError("Name, email and password are required", 400);
    }

    // Permission check
    const isSignup = c.req.path.includes("signup");

    if (isSignup) {
      // Check if user creation is disabled (would come from settings)
      const allowUserCreation = true; // TODO: Implement CheckSettings
      if (!allowUserCreation) {
        throw new AppError("User creation is disabled", 403);
      }
    } else if (user.profile !== "admin") {
      throw new AppError("Permission denied", 403);
    }

    const newUserCompanyId = bodyCompanyId || user.companyId;

    // Only admin can create users on other companies
    if (newUserCompanyId !== user.companyId && user.profile !== "admin") {
      throw new AppError("Cannot create users in other companies", 403);
    }

    const db = new D1Adapter(c.env.DB);

    // Check if email already exists
    const existingUser = await db.findOne("users", { email });
    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      name,
      email,
      password: hashedPassword,
      profile: profile || "agent",
      companyId: newUserCompanyId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert("users", newUser);

    // Get created user
    const createdUser = await db.findOne("users", { email });

    // Broadcast to Durable Object (WebSocket notification)
    try {
      const id = c.env.WS_NAMESPACE.idFromName(`company-${newUserCompanyId}`);
      const stub = c.env.WS_NAMESPACE.get(id);
      await stub.fetch(
        new Request("https://workers.local/notify", {
          method: "POST",
          body: JSON.stringify({
            type: "user_created",
            action: "create",
            user: createdUser
          })
        })
      );
    } catch (wsError) {
      console.error("WebSocket notification failed:", wsError);
      // Don't fail the request if WebSocket notification fails
    }

    return c.json(createdUser, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    console.error("Create user error:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
};

// Get user by ID
export const show = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    const userId = c.req.param("userId");

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const db = new D1Adapter(c.env.DB);
    const foundUser = await db.findOne("users", { id: parseInt(userId) });

    if (!foundUser) {
      throw new AppError("User not found", 404);
    }

    // Check if user has access to view this user
    if (!requireCompanyAccess(c, foundUser.companyId)) {
      throw new AppError("Permission denied", 403);
    }

    // Remove sensitive data
    const { password, ...userWithoutPassword } = foundUser;

    return c.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    return c.json({ error: "Failed to fetch user" }, 500);
  }
};

// Update user
export const update = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    if (user.profile !== "admin") {
      throw new AppError("Permission denied", 403);
    }

    const userId = c.req.param("userId");
    const body = await c.req.json();

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const db = new D1Adapter(c.env.DB);

    // Check if user exists
    const existingUser = await db.findOne("users", { id: parseInt(userId) });
    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    // Verify company access
    if (!requireCompanyAccess(c, existingUser.companyId)) {
      throw new AppError("Permission denied", 403);
    }

    // Update user
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Hash password if provided
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    await db.update("users", updateData, { id: parseInt(userId) });

    // Get updated user
    const updatedUser = await db.findOne("users", { id: parseInt(userId) });

    // Broadcast update
    try {
      const id = c.env.WS_NAMESPACE.idFromName(
        `company-${user.companyId}`
      );
      const stub = c.env.WS_NAMESPACE.get(id);
      await stub.fetch(
        new Request("https://workers.local/notify", {
          method: "POST",
          body: JSON.stringify({
            type: "user_updated",
            action: "update",
            user: updatedUser
          })
        })
      );
    } catch (wsError) {
      console.error("WebSocket notification failed:", wsError);
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return c.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    console.error("Update user error:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
};

// Delete user
export const remove = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    if (user.profile !== "admin") {
      throw new AppError("Permission denied", 403);
    }

    const userId = c.req.param("userId");

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const db = new D1Adapter(c.env.DB);

    // Check if user exists
    const existingUser = await db.findOne("users", { id: parseInt(userId) });
    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    // Verify company access
    if (!requireCompanyAccess(c, existingUser.companyId)) {
      throw new AppError("Permission denied", 403);
    }

    // Delete user
    await db.delete("users", { id: parseInt(userId) });

    // Broadcast deletion
    try {
      const id = c.env.WS_NAMESPACE.idFromName(
        `company-${user.companyId}`
      );
      const stub = c.env.WS_NAMESPACE.get(id);
      await stub.fetch(
        new Request("https://workers.local/notify", {
          method: "POST",
          body: JSON.stringify({
            type: "user_deleted",
            action: "delete",
            userId: parseInt(userId)
          })
        })
      );
    } catch (wsError) {
      console.error("WebSocket notification failed:", wsError);
    }

    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    console.error("Delete user error:", error);
    return c.json({ error: "Failed to delete user" }, 500);
  }
};

// Simple list (for dropdowns/selects)
export const list = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    const queryCompanyId = c.req.query("companyId");
    const companyId = queryCompanyId
      ? parseInt(queryCompanyId)
      : user.companyId;

    // Verify access
    if (!requireCompanyAccess(c, companyId)) {
      throw new AppError("Permission denied", 403);
    }

    const db = new D1Adapter(c.env.DB);
    const users = await db.findAll("users", { companyId });

    // Remove sensitive data
    const safeUsers = users.map(({ password, ...u }) => u);

    return c.json(safeUsers);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    return c.json({ error: "Failed to list users" }, 500);
  }
};
