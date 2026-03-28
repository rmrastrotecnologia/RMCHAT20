// For Cloudflare Workers, environment variables are loaded from wrangler.toml and Cloudflare Secrets
// No need to load .env files in Workers environment

// Keep this for local development
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  const dotenv = require("dotenv");
  dotenv.config({
    path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
  });
}
