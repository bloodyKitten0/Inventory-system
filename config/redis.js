require("dotenv").config();

const { createClient } = require("redis");

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (error) => {
  console.error("Redis error:", error);
});

const connect = async () => {
  await client.connect();
};

module.exports = {
  client,
  connect,
};
//
