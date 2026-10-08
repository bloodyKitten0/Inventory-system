import pg from "../config/db.js";
import test from "../services/try-catch.js";
import checkRow from "../services/rows-check.js";
import readAll from "../services/read-all.js";
import readId from "../services/read-id.js";
import deleteId from "../services/remove.js";
import { one, two } from "../services/read-relation.js";

const read = readAll("orders_items");

const readOne = readId("orders_items", "item");

const create = test(async (req, res) => {
  const { order_id, product_id, quantity, price } = req.body;

  const result = await pg.query(
    `
    INSERT INTO orders_items
      (order_id, product_id, quantity, price)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [order_id, product_id, quantity, price],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { quantity, price } = req.body;

  const result = await pg.query(
    `
    UPDATE orders_items
    SET
      quantity = $2,
      price = $3
    WHERE id = $1
    RETURNING *
    `,
    [req.params.id, quantity, price],
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

export {
  read,
  readOne,
  create,
  update,
  remove,
  orderItems,
  productOrderItems,
  orderItemDetails,
};
