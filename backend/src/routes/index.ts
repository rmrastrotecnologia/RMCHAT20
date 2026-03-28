import { Hono } from "hono";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";

const routes = new Hono();

// Auth routes - no prefix (login, signup, etc)
routes.route("/auth", authRoutes);

// User routes - /users prefix
routes.route("/users", userRoutes);

// Health check
routes.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Ticket routes
routes.get("/tickets", async (c) => {
  // TODO: Implement get tickets
  return c.json({ tickets: [] }, 200);
});

routes.post("/tickets", async (c) => {
  // TODO: Implement create ticket
  return c.json({ ticket: {} }, 201);
});

// Contact routes
routes.get("/contacts", async (c) => {
  // TODO: Implement get contacts
  return c.json({ contacts: [] }, 200);
});

// Message routes
routes.get("/messages/:ticketId", async (c) => {
  // TODO: Implement get messages
  const ticketId = c.req.param("ticketId");
  return c.json({ messages: [] }, 200);
});

routes.post("/messages", async (c) => {
  // TODO: Implement send message
  return c.json({ message: {} }, 201);
});

// WhatsApp routes
routes.get("/whatsapp", async (c) => {
  // TODO: Implement get whatsapp sessions
  return c.json({ sessions: [] }, 200);
});

// Dashboard routes
routes.get("/dashboard", async (c) => {
  // TODO: Implement dashboard data
  return c.json({ stats: {} }, 200);
});

export default routes;
