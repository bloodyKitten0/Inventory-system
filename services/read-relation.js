const test = require(`./try-catch.js`);
const pg = require(`../config/db.js`);
const checkRow = require(`./rows-check.js`);

const one = (select, join, onE1, onE2, whereId) =>
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

const two = (select, join1, onsj1, onjj1, join2, onsj2, onjj2, swhere) =>
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

module.exports = { one, two };
//
