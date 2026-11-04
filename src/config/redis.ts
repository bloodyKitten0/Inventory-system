import dotenv from "dotenv";

dotenv.config();

import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const client = createClient({
  url: redisUrl,
});

client.on("error", (error) => {
  if (process.env.NODE_ENV !== "test") {
    console.error("Redis error:", error);
  }
});

const connect = async () => {
  if (!process.env.REDIS_URL && process.env.NODE_ENV !== "test") {
    throw new Error("REDIS_URL is not defined");
  }
  await client.connect();
};

export { client, connect };
