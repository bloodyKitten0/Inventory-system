import pg from "../config/db.js";
import test from "../services/try-catch.js";
import checkRow from "../services/rows-check.js";
import readAll from "../services/read-all.js";
import readId from "../services/read-id.js";
import deleteId from "../services/remove.js";
import { one, two } from "../services/read-relation.js";

const read = test(async (req, res) => {
  if (req.user?.customerId) {
    const result = await pg.query(
      `
      SELECT oi.*
      FROM orders_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.customer_id = $1
      ORDER BY oi.id
      `,
      [req.user.customerId],
    );
    return res.status(200).json(result.rows);
  }

  const result = await pg.query(`SELECT * FROM orders_items ORDER BY id`);
  res.status(200).json(result.rows);
});

const readOne = test(async (req, res) => {
  const result = await pg.query(
    `
    SELECT oi.*, o.customer_id
    FROM orders_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = $1
    `,
    [req.params.id],
  );

  if (!checkRow(result)) {
    return res.status(404).json("item not found");
  }

  const item = result.rows[0];

  if (req.user?.customerId && item.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.status(200).json(item);
});

const create = test(async (req, res) => {
  const { order_id, product_id, quantity, price } = req.body;

  const orderResult = await pg.query(
    `SELECT * FROM orders WHERE id = $1`,
    [order_id],
  );

  if (!checkRow(orderResult)) {
    return res.status(404).json({ message: "Order not found" });
  }

  const order = orderResult.rows[0];

  if (req.user?.customerId && order.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (order.status && order.status.toLowerCase() !== "pending") {
    return res.status(400).json({ message: "Cannot add items to non-pending order" });
  }

  const productResult = await pg.query(
    `SELECT price FROM products WHERE id = $1`,
    [product_id],
  );

  if (!checkRow(productResult)) {
    return res.status(404).json({ message: "Product not found" });
  }

  const verifiedPrice = productResult.rows[0].price !== undefined ? productResult.rows[0].price : price;

  const result = await pg.query(
    `
    INSERT INTO orders_items
      (order_id, product_id, quantity, price)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [order_id, product_id, quantity, verifiedPrice],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { quantity, price } = req.body;

  const itemResult = await pg.query(
    `
    SELECT oi.*, o.customer_id, o.status as order_status
    FROM orders_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = $1
    `,
    [req.params.id],
  );

  if (!checkRow(itemResult)) {
    return res.status(404).json({
      message: "Item not found",
    });
  }

  const currentItem = itemResult.rows[0];

  if (req.user?.customerId && currentItem.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (currentItem.order_status && currentItem.order_status.toLowerCase() !== "pending") {
    return res.status(400).json({
      message: "Cannot modify items of a processed or non-pending order",
    });
  }

  const verifiedPrice = req.user?.customerId ? currentItem.price : price;

  const result = await pg.query(
    `
    UPDATE orders_items
    SET
      quantity = COALESCE($2, quantity),
      price = COALESCE($3, price)
    WHERE id = $1
    RETURNING *
    `,
    [req.params.id, quantity, verifiedPrice],
  );

  res.status(200).json(result.rows[0]);
});

const remove = test(async (req, res) => {
  const itemResult = await pg.query(
    `
    SELECT oi.*, o.customer_id, o.status as order_status
    FROM orders_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = $1
    `,
    [req.params.id],
  );

  if (!checkRow(itemResult)) {
    return res.status(404).json({ message: "Item not found" });
  }

  const currentItem = itemResult.rows[0];

  if (req.user?.customerId && currentItem.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (currentItem.order_status && currentItem.order_status.toLowerCase() !== "pending") {
    return res.status(400).json({
      message: "Cannot delete items from a processed or non-pending order",
    });
  }

  const result = await pg.query(
    `DELETE FROM orders_items WHERE id = $1 RETURNING *`,
    [req.params.id],
  );

  res.status(200).json(result.rows[0]);
});

const orderItems = test(async (req, res) => {
  const orderId = req.params.id;
  const orderRes = await pg.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  if (!checkRow(orderRes)) return res.status(404).json("relation not found");
  if (req.user?.customerId && orderRes.rows[0].customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const result = await pg.query(
    `SELECT * FROM orders_items WHERE order_id = $1 ORDER BY id`,
    [orderId],
  );
  res.status(200).json(result.rows);
});

const productOrderItems = test(async (req, res) => {
  const productId = req.params.id;
  if (req.user?.customerId) {
    const result = await pg.query(
      `
      SELECT oi.*
      FROM orders_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = $1 AND o.customer_id = $2
      ORDER BY oi.id
      `,
      [productId, req.user.customerId],
    );
    return res.status(200).json(result.rows);
  }

  const result = await pg.query(
    `SELECT * FROM orders_items WHERE product_id = $1 ORDER BY id`,
    [productId],
  );
  if (!checkRow(result)) return res.status(404).json("relation not found");
  res.status(200).json(result.rows);
});

const orderItemDetails = test(async (req, res) => {
  const result = await pg.query(
    `
    SELECT
      oi.id as item_id,
      oi.order_id,
      oi.product_id,
      oi.quantity,
      oi.price,
      o.customer_id,
      o.warehouse_id,
      o.status as order_status,
      p.name as product_name,
      p.category_id,
      p.price as product_price
    FROM orders_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE oi.id = $1
    `,
    [req.params.id],
  );

  if (!checkRow(result)) {
    return res.status(404).json("relation not found");
  }

  const item = result.rows[0];
  if (req.user?.customerId && item.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.status(200).json(result.rows);
});

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
