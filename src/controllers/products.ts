import pg from "../config/db.js";
import test from "../services/try-catch.js";
import checkRow from "../services/rows-check.js";
import readAll from "../services/read-all.js";
import readId from "../services/read-id.js";
import deleteId from "../services/remove.js";

const read = readAll(`products`);

const readOne = readId("products", "Product");

const create = test(async (req, res) => {
  const { name, category_id, description, price } = req.body;

  const result = await pg.query(
    `
    INSERT INTO products(name, category_id, description, price)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [name.trim(), category_id, description?.trim(), price],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { name, category_id, description, price } = req.body;

  const result = await pg.query(
    `
    UPDATE products
    SET
      name = $2,
      category_id = $3,
      description = $4,
      price = $5
    WHERE id = $1
    RETURNING *
    `,
    [req.params.id, name.trim(), category_id, description?.trim(), price],
  );

  if (!checkRow(result)) {
    return res.status(404).json("Product not found");
  }

  res.status(200).json(result.rows[0]);
});

const remove = deleteId(`products`, "Products");

export {
  read,
  readOne,
  create,
  update,
  remove,
};
