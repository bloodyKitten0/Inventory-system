import type { Request, Response, NextFunction } from "express";
import * as sessions from "../services/sessions.js";

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const session = await sessions.getSession(sessionId);

    if (!session) {
      res.status(401).json({
        message: "This session is not valid",
      });
      return;
    }

    req.user = session;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
