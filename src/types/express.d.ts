import type { Session } from "../services/sessions.js";

declare global {
  namespace Express {
    interface Request {
      user?: Session;
    }
  }
}

export {};
