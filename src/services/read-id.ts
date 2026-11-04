import type { Request } from "express";
import test from "./try-catch.js";
import pg from "../config/db.js";
import checkRow from "./rows-check.js";

const readId = (
  col: string,
  name: string,
  id: string = "id",
  buildQuery: (req: Request) => { query: string; values: unknown[] } = (
    req,
  ) => ({
    query: `
      SELECT *
      FROM ${col}
      WHERE ${id} = $1
    `,
    values: [req.params.id],
  }),
) =>
  test(async (req, res) => {
    const { query, values } = buildQuery(req);

    const result = await pg.query(query, values);

    if (!checkRow(result)) {
      return res.status(404).json(`${name} not found`);
    }

    res.status(200).json(result.rows[0]);
  });

export default readId;
