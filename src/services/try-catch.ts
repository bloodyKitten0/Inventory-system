import type { Request, Response, NextFunction } from "express";

const test = (
  callback: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await callback(req, res, next);
    } catch (e) {
      next(e);
    }
  };
};

export default test;
