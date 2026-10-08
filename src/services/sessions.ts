import { randomBytes } from "crypto";
import { client } from "../config/redis.js";

interface Session {
  userId: number;
}

const SESSION_TTL = Number(process.env.SESSION_TTL);

const createSession = async (userId: number): Promise<string> => {
  const sessionId = randomBytes(32).toString("hex");
  const key = `session:${sessionId}`;
  const data = { userId };
  await client.set(key, JSON.stringify(data), { EX: SESSION_TTL });
  return sessionId;
};

const getSession = async (sessionId: string): Promise<Session | null> => {
  const key = `session:${sessionId}`;
  const value = await client.get(key);
  if (!value) return null;
  const session: Session = JSON.parse(value);
  return session;
};

const deleteSession = async (sessionId: string): Promise<void> => {
  const key = `session:${sessionId}`;
  await client.del(key);
};

export { createSession, getSession, deleteSession };
export type { Session };
