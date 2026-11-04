import pg from "../config/db.js";
import test from "../services/try-catch.js";
import checkRow from "../services/rows-check.js";
import readAll from "../services/read-all.js";
import readId from "../services/read-id.js";
import deleteId from "../services/remove.js";
import { one, two } from "../services/read-relation.js";
import { withTransaction } from "../services/transaction.js";

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

  const result = await withTransaction(async (client) => {
    const orderResult = await client.query(
      `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
      [order_id],
    );

    if (!checkRow(orderResult)) {
      return { status: 404, body: { message: "Order not found" } };
    }

    const order = orderResult.rows[0];

    if (req.user?.customerId && order.customer_id !== req.user.customerId) {
      return { status: 403, body: { message: "Forbidden" } };
    }

    if (order.status && order.status.toLowerCase() !== "pending") {
      return { status: 400, body: { message: "Cannot add items to non-pending order" } };
    }

    const productResult = await client.query(
      `SELECT price FROM products WHERE id = $1`,
      [product_id],
    );

    if (!checkRow(productResult)) {
      return { status: 404, body: { message: "Product not found" } };
    }

    const verifiedPrice = productResult.rows[0].price !== undefined ? productResult.rows[0].price : price;

    const insertResult = await client.query(
      `
      INSERT INTO orders_items
        (order_id, product_id, quantity, price)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [order_id, product_id, quantity, verifiedPrice],
    );

    return { status: 201, body: insertResult.rows[0] };
  });

  res.status(result.status).json(result.body);
});

const update = test(async (req, res) => {
  const { quantity, price } = req.body;

  const result = await withTransaction(async (client) => {
    const itemResult = await client.query(
      `
      SELECT oi.*, o.customer_id, o.status as order_status
      FROM orders_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = $1
      FOR UPDATE OF o
      `,
      [req.params.id],
    );

    if (!checkRow(itemResult)) {
      return {
        status: 404,
        body: { message: "Item not found" },
      };
    }

    const currentItem = itemResult.rows[0];

    if (req.user?.customerId && currentItem.customer_id !== req.user.customerId) {
      return { status: 403, body: { message: "Forbidden" } };
    }

    if (currentItem.order_status && currentItem.order_status.toLowerCase() !== "pending") {
      return {
        status: 400,
        body: { message: "Cannot modify items of a processed or non-pending order" },
      };
    }

    const verifiedPrice = req.user?.customerId ? currentItem.price : price;

    const updateResult = await client.query(
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

    return { status: 200, body: updateResult.rows[0] };
  });

  res.status(result.status).json(result.body);
});

const remove = test(async (req, res) => {
  const result = await withTransaction(async (client) => {
    const itemResult = await client.query(
      `
      SELECT oi.*, o.customer_id, o.status as order_status
      FROM orders_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = $1
      FOR UPDATE OF o
      `,
      [req.params.id],
    );

    if (!checkRow(itemResult)) {
      return { status: 404, body: { message: "Item not found" } };
    }

    const currentItem = itemResult.rows[0];

    if (req.user?.customerId && currentItem.customer_id !== req.user.customerId) {
      return { status: 403, body: { message: "Forbidden" } };
    }

    if (currentItem.order_status && currentItem.order_status.toLowerCase() !== "pending") {
      return {
        status: 400,
        body: { message: "Cannot delete items from a processed or non-pending order" },
      };
    }

    const deleteResult = await client.query(
      `DELETE FROM orders_items WHERE id = $1 RETURNING *`,
      [req.params.id],
    );

    return { status: 200, body: deleteResult.rows[0] };
  });

  res.status(result.status).json(result.body);
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
