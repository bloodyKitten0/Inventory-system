const test = require(`./try-catch`);
const pg = require(`../config/db.js`);

const readAll = (name) =>
  test(async (req, res) => {
    const result = await pg.query(`SELECT * FROM ${name}`);
    res.status(200).json(result.rows);
  });

module.exports = readAll;
