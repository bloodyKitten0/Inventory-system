import pg from "../config/db.js";
import test from "../services/try-catch.js";
import checkRow from "../services/rows-check.js";
import readAll from "../services/read-all.js";
import readId from "../services/read-id.js";
import deleteId from "../services/remove.js";

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
    [name.trim(), location.trim()],
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
    [req.params.id, name.trim(), location.trim()],
  );

  if (!checkRow(result)) {
    return res.status(404).json("Warehouse not found");
  }

  res.status(200).json(result.rows[0]);
});

const remove = deleteId(`warehouses`, "Warehouse");

export {
  read,
  readOne,
  create,
  update,
  remove,
};
