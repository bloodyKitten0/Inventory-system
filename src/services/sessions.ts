import { randomBytes } from "crypto";
import { client } from "../config/redis.js";

interface Session {
  userId: number;
  customerId?: number | null;
}

const getSessionTtl = (): number => {
  const rawTtl = Number(process.env.SESSION_TTL);
  if (!Number.isInteger(rawTtl) || rawTtl <= 0) {
    throw new Error("SESSION_TTL must be a positive integer");
  }
  return rawTtl;
};

const SESSION_TTL = getSessionTtl();

const createSession = async (
  userId: number,
  customerId?: number | null,
): Promise<string> => {
  const sessionId = randomBytes(32).toString("hex");
  const key = `session:${sessionId}`;
  const data: Session = {
    userId,
    ...(customerId !== undefined ? { customerId } : {}),
  };
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

export { createSession, getSession, deleteSession, SESSION_TTL };
export type { Session };
