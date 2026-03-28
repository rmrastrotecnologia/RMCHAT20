import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import * as UserController from "../controllers/UserController";

const users = new Hono();

// All user routes require authentication
users.use("*", authMiddleware);

// List users with pagination
users.get("/", UserController.index);

// Simple list (without pagination) - get this before :userId
users.get("/list", UserController.list);

// Create user
users.post("/", UserController.store);

// Get user by ID
users.get("/:userId", UserController.show);

// Update user
users.put("/:userId", UserController.update);

// Delete user
users.delete("/:userId", UserController.remove);

export default users;
