import pg from "../config/db.js";
import test from "../services/try-catch.js";
import checkRow from "../services/rows-check.js";
import readAll from "../services/read-all.js";
import readId from "../services/read-id.js";
import deleteId from "../services/remove.js";
import { one } from "../services/read-relation.js";

const read = readAll("orders");

const readOne = readId("orders", "order");

const create = test(async (req, res) => {
  const { customer_id, warehouse_id } = req.body;

  const result = await pg.query(
    `
    INSERT INTO orders
      (customer_id, warehouse_id, status, created_at)
    VALUES
      ($1, $2, 'pending', now())
    RETURNING *
    `,
    [customer_id, warehouse_id],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { customer_id, warehouse_id, status } = req.body;

  const result = await pg.query(
    `
    UPDATE orders
    SET
      customer_id = $2,
      warehouse_id = $3,
      status = $4
    WHERE id = $1
    RETURNING *
    `,
    [req.params.id, customer_id, warehouse_id, status],
  );

  if (!checkRow(result)) {
    return res.status(404).json("order not found");
  }

  res.status(200).json(result.rows[0]);
});

const remove = deleteId("orders", "order");

const customerOrders = one(
  "orders",
  "customers",
  "id",
  "customer_id",
  "customer_id",
);

const warehouseOrders = one(
  "orders",
  "warehouses",
  "id",
  "warehouse_id",
  "warehouse_id",
);

const updateStatus = test(async (req, res) => {
  const { status } = req.body;

  const result = await pg.query(
    `
    UPDATE orders
    SET status = $1
    WHERE id = $2
    RETURNING *
    `,
    [status, req.params.id],
  );

  if (!checkRow(result)) {
    return res.status(404).json("order not found");
  }

  res.status(200).json(result.rows[0]);
});

const cancelOrder = test(async (req, res) => {
  const result = await pg.query(
    `
    UPDATE orders
    SET status = 'cancelled'
    WHERE
      id = $1
      AND status = 'pending'
    RETURNING *
    `,
    [req.params.id],
  );

  if (!checkRow(result)) {
    return res.status(404).json("order not found or can't be canceled");
  }

  res.status(200).json(result.rows[0]);
});

const orderDetails = test(async (req, res) => {
  const result = await pg.query(
    `
    SELECT *
    FROM orders o
    JOIN orders_items oi
      ON oi.order_id = o.id
    JOIN products p
      ON p.id = oi.product_id
    WHERE o.id = $1
    `,
    [req.params.id],
  );

  if (!checkRow(result)) {
    return res.status(404).json("order not found");
  }

  res.status(200).json(result.rows);
});

const calculateOrderTotal = test(async (req, res) => {
  const result = await pg.query(
    `
    SELECT
      order_id,
      SUM(quantity * price) AS total
    FROM orders_items
    WHERE order_id = $1
    GROUP BY order_id
    `,
    [req.params.id],
  );

  if (!checkRow(result)) {
    return res.status(404).json("order not found");
  }

  res.status(200).json(result.rows[0]);
});

const processOrder = test(async (req, res) => {
  const transaction = await pg.connect();

  try {
    await transaction.query(`BEGIN`);

    const orderResult = await transaction.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
      FOR UPDATE
      `,
      [req.params.id],
    );

    if (!checkRow(orderResult)) {
      await transaction.query(`ROLLBACK`);
      return res.status(404).json("Order not found");
    }

    const order = orderResult.rows[0];

    // Business rule: only pending orders can be processed.
    if (order.status.toLowerCase() !== "pending") {
      await transaction.query(`ROLLBACK`);

      return res.status(400).json({
        error: "Order cannot be processed",
        currentStatus: order.status,
        requiredStatus: "pending",
      });
    }

    const itemsResult = await transaction.query(
      `
      SELECT *
      FROM orders_items
      WHERE order_id = $1
      `,
      [req.params.id],
    );

    if (!checkRow(itemsResult)) {
      await transaction.query(`ROLLBACK`);
      return res.status(400).json("Order has no items");
    }

    for (const item of itemsResult.rows) {
      const inventoryResult = await transaction.query(
        `
        SELECT *
        FROM inventory
        WHERE
          product_id = $1
          AND warehouse_id = $2
        FOR UPDATE
        `,
        [item.product_id, order.warehouse_id],
      );

      if (!checkRow(inventoryResult)) {
        await transaction.query(`ROLLBACK`);

        return res
          .status(400)
          .json(`Product ${item.product_id} is not in this warehouse`);
      }

      const inventory = inventoryResult.rows[0];

      // Business rule: an order cannot consume more stock than exists.
      if (inventory.amount < item.quantity) {
        await transaction.query(`ROLLBACK`);

        return res
          .status(400)
          .json(`Not enough stock for product ${item.product_id}`);
      }

      await transaction.query(
        `
        UPDATE inventory
        SET
          amount = amount - $1,
          last_update = now()
        WHERE id = $2
        `,
        [item.quantity, inventory.id],
      );

      await transaction.query(
        `
        INSERT INTO stock_movements
          (product_id, warehouse_id, movement_type, quantity, created_at)
        VALUES
          ($1, $2, 'SALE', $3, now())
        `,
        [item.product_id, order.warehouse_id, item.quantity],
      );
    }

    const updatedOrder = await transaction.query(
      `
      UPDATE orders
      SET status = 'processing'
      WHERE id = $1
      RETURNING *
      `,
      [req.params.id],
    );

    await transaction.query(`COMMIT`);

    res.status(200).json(updatedOrder.rows[0]);
  } catch (e) {
    await transaction.query(`ROLLBACK`);
    throw e;
  } finally {
    transaction.release();
  }
});

export {
  read,
  readOne,
  create,
  update,
  remove,
  customerOrders,
  warehouseOrders,
  updateStatus,
  cancelOrder,
  orderDetails,
  calculateOrderTotal,
  processOrder,
};
