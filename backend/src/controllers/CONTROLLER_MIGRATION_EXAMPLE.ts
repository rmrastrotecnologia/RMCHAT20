// Example: How to refactor a Controller from Express to Hono

// OLD EXAMPLE (Express):
/*
import { Request, Response } from "express";

export const index = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const show = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    const user = await User.create({ name, email });
    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
*/

// NEW EXAMPLE (Hono):
import { Context } from "hono";
import { D1Adapter } from "../config/d1";
import AppError from "../errors/AppError";

export interface User {
  id: number;
  name: string;
  email: string;
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
}

export const index = async (c: Context) => {
  try {
    const db = new D1Adapter(c.env.DB);
    const users = await db.findAll("users");
    return c.json(users);
  } catch (error) {
    throw new AppError("Failed to fetch users", 500);
  }
};

export const show = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const db = new D1Adapter(c.env.DB);

    const user = await db.findOne("users", { id: parseInt(id) });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return c.json(user);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode);
    }
    throw error;
  }
};

export const create = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { name, email, companyId } = body;

    // Validate
    if (!name || !email) {
      throw new AppError("Name and email are required", 400);
    }

    const db = new D1Adapter(c.env.DB);
    const result = await db.insert("users", {
      name,
      email,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return c.json(result, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode);
    }
    throw error;
  }
};

export const update = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const db = new D1Adapter(c.env.DB);

    // Check if user exists
    const user = await db.findOne("users", { id: parseInt(id) });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Update
    await db.update(
      "users",
      { ...body, updatedAt: new Date() },
      { id: parseInt(id) }
    );

    const updated = await db.findOne("users", { id: parseInt(id) });
    return c.json(updated);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode);
    }
    throw error;
  }
};

export const remove = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const db = new D1Adapter(c.env.DB);

    // Check if user exists
    const user = await db.findOne("users", { id: parseInt(id) });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Delete
    await db.delete("users", { id: parseInt(id) });

    return c.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      return c.json({ error: error.message }, error.statusCode);
    }
    throw error;
  }
};
