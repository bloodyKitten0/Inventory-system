const test = require(`./try-catch`);
const pg = require(`../config/db.js`);
const checkRow = require(`./rows-check.js`);

const remove = (col, name, id = `id`) =>
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

module.exports = remove;
