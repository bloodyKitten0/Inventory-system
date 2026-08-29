const pg = require("../config/db.js");
const test = require("../services/try-catch.js");
const checkRow = require("../services/rows-check.js");
const readAll = require("../services/read-all.js");
const readId = require("../services/read-id.js");
const deleteId = require("../services/remove.js");
const { one, two } = require("../services/read-relation.js");

const read = readAll("orders_items");

const readOne = readId("orders_items", "item");

const create = test(async (req, res) => {
  const { oid, pid, quan, price } = req.body;

  const result = await pg.query(
    `
    INSERT INTO orders_items
      (order_id, product_id, quantity, price)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [oid, pid, quan, price],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { oid, pid, quan, price } = req.body;

  const result = await pg.query(
    `
    UPDATE orders_items
    SET
      order_id = $2,
      product_id = $3,
      quantity = $4,
      price = $5
    WHERE id = $1
    RETURNING *
    `,
    [req.params.id, oid, pid, quan, price],
  );

  if (!checkRow(result)) {
    return res.status(404).json({
      message: "Item not found",
    });
  }

  res.status(200).json(result.rows[0]);
});

const remove = deleteId("orders_items", "item");

const orderItems = one("orders_items", "orders", "id", "order_id", "order_id");

const productOrderItems = one(
  "orders_items",
  "products",
  "id",
  "product_id",
  "product_id",
);

const orderItemDetails = two(
  "orders_items",
  "orders",
  "order_id",
  "id",
  "products",
  "product_id",
  "id",
  "id",
);

module.exports = {
  read,
  readOne,
  create,
  update,
  remove,
  orderItems,
  productOrderItems,
  orderItemDetails,
};
