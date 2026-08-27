const test = require(`./try-catch`);
const pg = require(`../config/db.js`);

const readAll = (
  name,
  build = () => ({ query: `SELECT * FROM ${name}`, values: [] }),
) =>
  test(async (req, res) => {
    const { query, values } = build(req);
    const result = await pg.query(query, values);
    res.status(200).json(result.rows);
  });

module.exports = readAll;
