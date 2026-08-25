const { randomBytes } = require("crypto");
const { client } = require("../config/redis.js");

const SESSION_TTL = Number(process.env.SESSION_TTL);

const createSession = async (userId) => {
  const sessionId = randomBytes(32).toString("hex");
  const key = `session:${sessionId}`;
  const data = { userId };
  await client.set(key, JSON.stringify(data), { EX: SESSION_TTL });
  return sessionId;
};

const getSession = async (sessionId) => {
  const key = `session:${sessionId}`;
  const value = await client.get(key);
  if (!value) return null;
  const session = JSON.parse(value);
  return session;
};

const deleteSession = async (sessionId) => {
  const key = `session:${sessionId}`;
  await client.del(key);
};

module.exports = { createSession, getSession, deleteSession };
