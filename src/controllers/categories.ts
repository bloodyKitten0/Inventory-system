import pg from "../config/db.js";
import test from "../services/try-catch.js";
import checkRow from "../services/rows-check.js";
import readAll from "../services/read-all.js";
import readId from "../services/read-id.js";
import deleteId from "../services/remove.js";

const read = readAll("categories");

const readOne = readId("categories", "Category");

const create = test(async (req, res) => {
  const { name, description } = req.body;

  const result = await pg.query(
    `
    INSERT INTO categories(name, created_at, updated_at, description)
    VALUES ($1, now(), now(), $2)
    RETURNING *
    `,
    [name.trim(), description?.trim()],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { name, description } = req.body;

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
    [req.params.id, name.trim(), description?.trim()],
  );

  if (!checkRow(result)) {
    return res.status(404).json({
      message: "Category not found",
    });
  }

  res.status(200).json(result.rows[0]);
});

const remove = deleteId("categories", "Category");

export {
  read,
  readOne,
  create,
  update,
  remove,
};
