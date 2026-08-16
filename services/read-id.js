const test = require(`./try-catch.js`);
const pg = require(`../config/db.js`);
const checkRow = require(`./rows-check.js`);

const readId = (col, name, id = `id`) =>
  test(async (req, res) => {
    const result = await pg.query(
      `
    SELECT * FROM ${col}
    WHERE ${id} = $1
    `,
      [req.params.id],
    );

    if (!checkRow(result)) return res.status(404).json(`${name} not found`);

    res.status(200).json(result.rows[0]);
  });

module.exports = readId;
