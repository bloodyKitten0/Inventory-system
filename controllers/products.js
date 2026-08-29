const pg = require("../config/db.js");
const test = require("../services/try-catch.js");
const checkRow = require("../services/rows-check.js");
const readAll = require("../services/read-all.js");
const readId = require("../services/read-id.js");
const deleteId = require("../services/remove.js");

const read = readAll(`products`);

const readOne = readId("products", "Product");

const create = test(async (req, res) => {
  const { name, cata, desc, price } = req.body;

  const result = await pg.query(
    `
    INSERT INTO products(name, category_id, description, price)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [name.trim(), cata, desc.trim(), price],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { name, cata, desc, price } = req.body;

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
    [req.params.id, name.trim(), cata, desc.trim(), price],
  );

  if (!checkRow(result)) {
    return res.status(404).json("Product not found");
  }

  res.status(200).json(result.rows[0]);
});

const remove = deleteId(`products`, "Products");

module.exports = {
  read,
  readOne,
  create,
  update,
  remove,
};
