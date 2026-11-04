import test from "./try-catch.js";
import pg from "../config/db.js";
import checkRow from "./rows-check.js";

const one = (
  select: string,
  join: string,
  onE1: string,
  onE2: string,
  whereId: string,
) =>
  test(async (req, res) => {
    const result = await pg.query(
      `
    SELECT * FROM ${select} s
    JOIN ${join} j
    ON j.${onE1} = s.${onE2}
    WHERE s.${whereId} = $1 
    `,
      [req.params.id],
    );
    if (!checkRow(result)) return res.status(404).json("relation not found");
    res.status(200).json(result.rows);
  });

const two = (
  select: string,
  join1: string,
  onsj1: string,
  onjj1: string,
  join2: string,
  onsj2: string,
  onjj2: string,
  swhere: string,
) =>
  test(async (req, res) => {
    const result = await pg.query(
      `
        SELECT * FROM ${select} s
        JOIN ${join1} j1
        ON s.${onsj1} = j1.${onjj1}
        JOIN ${join2} j2
        ON s.${onsj2} = j2.${onjj2}
        WHERE s.${swhere}= $1
        `,
      [req.params.id],
    );
    if (!checkRow(result))
      return res.status(404).json("No rows have been found");
    res.status(200).json(result.rows);
  });

export { one, two };
