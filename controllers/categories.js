const pg = require("../config/db.js");
const test = require("../services/try-catch.js");
const checkRow = require("../services/rows-check.js");
const readAll = require(`../services/read-all.js`);
const readId = require("../services/read-id.js");
const deleteId = require("../services/remove.js");

const read = readAll(`categories`);

const readOne = readId("categories", "Category");

const create = test(async (req, res) => {
  const { name, desc } = req.body;

  const result = await pg.query(
    `
    INSERT INTO categories(name,created_at,updated_at, description)
    VALUES ($1, now(), now(), $2)
    RETURNING *
    `,
    [name, desc],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { name, desc } = req.body;

  const result = await pg.query(
    `
    UPDATE categories
    SET
      name = $2,
      updated_at = now(),
      description = $3
    WHERE id = $1
    RETURNING *
    `,
    [req.params.id, name, desc],
  );

  if (!checkRow(result)) return res.status(404).json("category not found");

  res.status(200).json(result.rows[0]);
});

const remove = deleteId(`categories`, "Category");

module.exports = {
  read,
  readOne,
  create,
  update,
  remove,
};
