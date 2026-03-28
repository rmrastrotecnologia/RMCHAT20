import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "./utils/logger";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  WS_NAMESPACE: DurableObjectNamespace;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use(
  "*",
  cors({
    origin: (process.env.FRONTEND_URL = "http://localhost:3000"),
    credentials: true,
  })
);

// Routes
app.route("/api", routes);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error Handler
app.onError(errorHandler);

// 404 Handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

// WebSocket upgrade for Durable Objects
app.get("/ws/:ticketId", async (c) => {
  const ticketId = c.req.param("ticketId");
  const upgradeHeader = c.req.header("Upgrade");

  if (upgradeHeader !== "websocket") {
    return c.text("Upgrade header must be 'websocket'", 400);
  }

  try {
    const id = c.env.WS_NAMESPACE.idFromName(ticketId);
    const stub = c.env.WS_NAMESPACE.get(id);

    // Upgrade to WebSocket via Durable Object
    return stub.fetch(c.req.raw);
  } catch (error) {
    logger.error(error);
    return c.json({ error: "WebSocket connection failed" }, 500);
  }
});

export default app;