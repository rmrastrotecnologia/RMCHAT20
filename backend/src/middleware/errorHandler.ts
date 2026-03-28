import { Context } from "hono";
import { logger } from "../utils/logger";

export async function errorHandler(error: Error, c: Context) {
  const status = (error as any).statusCode || 500;
  const message = error.message || "Internal Server Error";

  logger.error(error);

  return c.json(
    {
      error: message,
      status,
      timestamp: new Date().toISOString(),
    },
    status
  );
}
