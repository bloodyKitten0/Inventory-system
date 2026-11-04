import dotenv from "dotenv";

dotenv.config();

import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

const client = createClient({
  url: redisUrl,
});

client.on("error", (error) => {
  console.error("Redis error:", error);
});

const connect = async () => {
  await client.connect();
};

export { client, connect };
