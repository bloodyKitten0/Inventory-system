import type { Request } from "express";
import test from "./try-catch.js";
import pg from "../config/db.js";

const readAll = (
  name: string,
  build: (req: Request) => { query: string; values: unknown[] } = () => ({
    query: `SELECT * FROM ${name}`,
    values: [],
  }),
) =>
  test(async (req, res) => {
    const { query, values } = build(req);
    const result = await pg.query(query, values);
    res.status(200).json(result.rows);
  });

export default readAll;
