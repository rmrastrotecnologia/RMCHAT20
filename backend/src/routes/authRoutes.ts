import { Hono } from "hono";
import * as AuthController from "../controllers/AuthController";
import { authMiddleware } from "../middleware/auth";

const auth = new Hono();

// Public routes
auth.post("/signup", AuthController.signup);
auth.post("/login", AuthController.login);
auth.post("/refresh-token", AuthController.refreshToken);

// Protected routes
auth.use("/logout", authMiddleware);
auth.delete("/logout", AuthController.logout);

auth.use("/me", authMiddleware);
auth.get("/me", async (c) => {
  const user = c.get("user");
  return c.json({ user });
});

export default auth;
