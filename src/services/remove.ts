import test from "./try-catch.js";
import pg from "../config/db.js";
import checkRow from "./rows-check.js";

const remove = (col: string, name: string, id: string = `id`) =>
  test(async (req, res) => {
    const result = await pg.query(
      `
    DELETE FROM ${col}
    WHERE ${id} = $1
    RETURNING *
    `,
      [req.params.id],
    );

    if (!checkRow(result)) return res.status(404).json(`${name} not found`);

    res.status(200).json(`${name} deleted`);
  });

export default remove;
