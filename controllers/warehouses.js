const pg = require("../config/db.js");
const test = require("../services/try-catch.js");
const checkRow = require("../services/rows-check.js");
const readAll = require(`../services/read-all.js`);
const readId = require("../services/read-id.js");
const deleteId = require("../services/remove.js");

const read = readAll(`warehouses`);

const readOne = readId("warehouses", "warehouse");

const create = test(async (req, res) => {
  const { name, location } = req.body;

  const result = await pg.query(
    `
    INSERT INTO warehouses
      (name, location, created_at, updated_at)
    VALUES
      ($1, $2, now(), now())
    RETURNING *
    `,
    [name, location],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { name, location } = req.body;

  const result = await pg.query(
    `
    UPDATE warehouses
    SET
      name = $2,
      location = $3,
      updated_at = now()
    WHERE id = $1
    RETURNING *
    `,
    [req.params.id, name, location],
  );

  if (!checkRow(result)) return res.status(404).json("Warehouse not found");

  res.status(200).json(result.rows[0]);
});

const remove = deleteId(`warehouses`, "Warehouse");

module.exports = {
  read,
  readOne,
  create,
  update,
  remove,
};
