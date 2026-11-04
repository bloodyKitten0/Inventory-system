import pg from "../config/db.js";
import test from "../services/try-catch.js";
import checkRow from "../services/rows-check.js";
import readAll from "../services/read-all.js";
import readId from "../services/read-id.js";
import deleteId from "../services/remove.js";
import { one } from "../services/read-relation.js";

const read = test(async (req, res) => {
  if (req.user?.customerId) {
    const result = await pg.query(
      `SELECT * FROM orders WHERE customer_id = $1 ORDER BY id`,
      [req.user.customerId],
    );
    return res.status(200).json(result.rows);
  }

  const result = await pg.query(`SELECT * FROM orders ORDER BY id`);
  res.status(200).json(result.rows);
});

const readOne = test(async (req, res) => {
  const result = await pg.query(
    `SELECT * FROM orders WHERE id = $1`,
    [req.params.id],
  );

  if (!checkRow(result)) {
    return res.status(404).json("order not found");
  }

  const order = result.rows[0];

  if (req.user?.customerId && order.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.status(200).json(order);
});

const create = test(async (req, res) => {
  const { warehouse_id } = req.body;
  const effectiveCustomerId = req.user?.customerId ?? req.body.customer_id;

  if (req.user?.customerId && req.body.customer_id && req.body.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const result = await pg.query(
    `
    INSERT INTO orders
      (customer_id, warehouse_id, status, created_at)
    VALUES
      ($1, $2, 'pending', now())
    RETURNING *
    `,
    [effectiveCustomerId, warehouse_id],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { customer_id, warehouse_id, status } = req.body;

  const existingOrder = await pg.query(
    `SELECT * FROM orders WHERE id = $1`,
    [req.params.id],
  );

  if (!checkRow(existingOrder)) {
    return res.status(404).json("order not found");
  }

  const current = existingOrder.rows[0];

  if (req.user?.customerId && current.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Prevent customer from reassigning customer_id on any order (even pending)
  if (req.user?.customerId && customer_id !== undefined && customer_id !== current.customer_id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const currentStatus = current.status?.toLowerCase();
  const nextStatus = status?.toLowerCase();

  if (currentStatus === "completed" || currentStatus === "cancelled") {
    if (nextStatus && nextStatus !== currentStatus) {
      return res.status(400).json({
        message: `Cannot transition order from terminal state '${current.status}'`,
      });
    }
  }

  if (nextStatus && nextStatus !== currentStatus) {
    if (currentStatus === "pending") {
      if (nextStatus === "processing") {
        return res.status(400).json({
          message: "Orders cannot change status to processing without processing inventory",
        });
      }
      if (nextStatus === "completed") {
        return res.status(400).json({
          message: "Cannot directly complete a pending order without fulfillment",
        });
      }
      if (nextStatus !== "cancelled") {
        return res.status(400).json({
          message: `Invalid status transition from '${current.status}' to '${status}'`,
        });
      }
    } else if (currentStatus === "processing") {
      if (nextStatus === "pending") {
        return res.status(400).json({
          message: "Processed orders cannot be reset to pending",
        });
      }
      if (nextStatus !== "completed" && nextStatus !== "cancelled") {
        return res.status(400).json({
          message: `Invalid status transition from '${current.status}' to '${status}'`,
        });
      }
    }
  }

  if (currentStatus !== "pending") {
    if (customer_id !== undefined && customer_id !== current.customer_id) {
      return res.status(400).json({
        message: "Order customer cannot be reassigned after processing",
      });
    }
    if (warehouse_id !== undefined && warehouse_id !== current.warehouse_id) {
      return res.status(400).json({
        message: "Order warehouse cannot be reassigned after processing",
      });
    }
  }

  const result = await pg.query(
    `
    UPDATE orders
    SET
      customer_id = COALESCE($2, customer_id),
      warehouse_id = COALESCE($3, warehouse_id),
      status = COALESCE($4, status)
    WHERE id = $1
    RETURNING *
    `,
    [req.params.id, customer_id, warehouse_id, status],
  );

  res.status(200).json(result.rows[0]);
});

const remove = test(async (req, res) => {
  const existingOrder = await pg.query(
    `SELECT * FROM orders WHERE id = $1`,
    [req.params.id],
  );

  if (!checkRow(existingOrder)) {
    return res.status(404).json("order not found");
  }

  const order = existingOrder.rows[0];

  if (req.user?.customerId && order.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const orderStatus = order.status?.toLowerCase();
  if (orderStatus === "completed") {
    return res.status(400).json({
      message: "Completed orders are immutable historical records and cannot be deleted",
    });
  }

  if (orderStatus === "processing") {
    const items = await pg.query(
      `SELECT * FROM orders_items WHERE order_id = $1`,
      [req.params.id],
    );
    for (const item of items.rows) {
      await pg.query(
        `UPDATE inventory SET amount = amount + $1 WHERE product_id = $2 AND warehouse_id = $3`,
        [item.quantity, item.product_id, order.warehouse_id],
      );
      await pg.query(
        `INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, created_at, reference_id, reason)
         VALUES ($1, $2, 'RECEIPT', $3, now(), $4, 'Order deletion reverse')`,
        [item.product_id, order.warehouse_id, item.quantity, req.params.id],
      );
    }
  }

  await pg.query(`DELETE FROM orders_items WHERE order_id = $1`, [req.params.id]);
  const result = await pg.query(
    `DELETE FROM orders WHERE id = $1 RETURNING *`,
    [req.params.id],
  );

  res.status(200).json(result.rows[0]);
});

const customerOrders = test(async (req, res) => {
  if (req.user?.customerId && Number(req.params.id) !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const result = await pg.query(
    `
    SELECT * FROM orders s
    JOIN customers j
    ON j.id = s.customer_id
    WHERE s.customer_id = $1 
    `,
    [req.params.id],
  );
  if (!checkRow(result)) return res.status(404).json("relation not found");
  res.status(200).json(result.rows);
});

const warehouseOrders = test(async (req, res) => {
  const warehouseId = req.params.id;

  if (req.user?.customerId) {
    const result = await pg.query(
      `SELECT * FROM orders WHERE warehouse_id = $1 AND customer_id = $2 ORDER BY id`,
      [warehouseId, req.user.customerId],
    );
    return res.status(200).json(result.rows);
  }

  const result = await pg.query(
    `SELECT * FROM orders WHERE warehouse_id = $1 ORDER BY id`,
    [warehouseId],
  );
  if (!checkRow(result)) {
    return res.status(404).json("relation not found");
  }
  res.status(200).json(result.rows);
});

const updateStatus = test(async (req, res) => {
  const { status } = req.body;

  const existingOrder = await pg.query(
    `SELECT * FROM orders WHERE id = $1`,
    [req.params.id],
  );

  if (!checkRow(existingOrder)) {
    return res.status(404).json("order not found");
  }

  const current = existingOrder.rows[0];

  if (req.user?.customerId && current.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const currentStatus = current.status?.toLowerCase();
  const nextStatus = status?.toLowerCase();

  if (currentStatus === "completed" || currentStatus === "cancelled") {
    if (nextStatus && nextStatus !== currentStatus) {
      return res.status(400).json({
        message: `Cannot transition order from terminal state '${current.status}'`,
      });
    }
  }

  if (nextStatus && nextStatus !== currentStatus) {
    if (currentStatus === "pending") {
      if (nextStatus === "processing") {
        return res.status(400).json({
          message: "Orders cannot change status to processing without processing inventory",
        });
      }
      if (nextStatus === "completed") {
        return res.status(400).json({
          message: "Cannot directly complete a pending order without fulfillment",
        });
      }
      if (nextStatus !== "cancelled") {
        return res.status(400).json({
          message: `Invalid status transition from '${current.status}' to '${status}'`,
        });
      }
    } else if (currentStatus === "processing") {
      if (nextStatus === "pending") {
        return res.status(400).json({
          message: "Processed orders cannot be reset to pending",
        });
      }
      if (nextStatus !== "completed" && nextStatus !== "cancelled") {
        return res.status(400).json({
          message: `Invalid status transition from '${current.status}' to '${status}'`,
        });
      }
    }
  }

  if (
    currentStatus === "processing" &&
    nextStatus === "cancelled"
  ) {
    const items = await pg.query(
      `SELECT * FROM orders_items WHERE order_id = $1`,
      [req.params.id],
    );
    for (const item of items.rows) {
      await pg.query(
        `UPDATE inventory SET amount = amount + $1 WHERE product_id = $2 AND warehouse_id = $3`,
        [item.quantity, item.product_id, current.warehouse_id],
      );
      await pg.query(
        `INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, created_at, reference_id, reason)
         VALUES ($1, $2, 'RECEIPT', $3, now(), $4, 'Order cancellation restore')`,
        [item.product_id, current.warehouse_id, item.quantity, req.params.id],
      );
    }
  }

  const result = await pg.query(
    `
    UPDATE orders
    SET status = $1
    WHERE id = $2
    RETURNING *
    `,
    [status, req.params.id],
  );

  res.status(200).json(result.rows[0]);
});

const cancelOrder = test(async (req, res) => {
  const existingOrder = await pg.query(
    `SELECT * FROM orders WHERE id = $1`,
    [req.params.id],
  );

  if (!checkRow(existingOrder)) {
    return res.status(404).json("order not found or can't be canceled");
  }

  const order = existingOrder.rows[0];

  if (req.user?.customerId && order.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const orderStatus = order.status?.toLowerCase();

  if (orderStatus === "completed" || orderStatus === "delivered" || orderStatus === "shipped") {
    return res.status(400).json({ message: "Order cannot be cancelled in its current state" });
  }

  if (orderStatus === "processing") {
    const items = await pg.query(
      `SELECT * FROM orders_items WHERE order_id = $1`,
      [req.params.id],
    );
    for (const item of items.rows) {
      await pg.query(
        `UPDATE inventory SET amount = amount + $1 WHERE product_id = $2 AND warehouse_id = $3`,
        [item.quantity, item.product_id, order.warehouse_id],
      );
      await pg.query(
        `INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, created_at, reference_id, reason)
         VALUES ($1, $2, 'RECEIPT', $3, now(), $4, 'Order cancellation restore')`,
        [item.product_id, order.warehouse_id, item.quantity, req.params.id],
      );
    }
  }

  const result = await pg.query(
    `
    UPDATE orders
    SET status = 'cancelled'
    WHERE id = $1
    RETURNING *
    `,
    [req.params.id],
  );

  res.status(200).json(result.rows[0]);
});

const orderDetails = test(async (req, res) => {
  const orderResult = await pg.query(
    `SELECT * FROM orders WHERE id = $1`,
    [req.params.id],
  );

  if (!checkRow(orderResult)) {
    return res.status(404).json("order not found");
  }

  const order = orderResult.rows[0];

  if (req.user?.customerId && order.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const result = await pg.query(
    `
    SELECT
      oi.id AS order_item_id,
      oi.order_id,
      oi.product_id,
      p.name AS product_name,
      oi.quantity,
      oi.price
    FROM orders_items oi
    JOIN products p
      ON p.id = oi.product_id
    WHERE oi.order_id = $1
    ORDER BY oi.id ASC
    `,
    [req.params.id],
  );

  res.status(200).json(result.rows);
});

const calculateOrderTotal = test(async (req, res) => {
  const orderResult = await pg.query(
    `SELECT * FROM orders WHERE id = $1`,
    [req.params.id],
  );

  if (!checkRow(orderResult)) {
    return res.status(404).json("order not found");
  }

  const order = orderResult.rows[0];

  if (req.user?.customerId && order.customer_id !== req.user.customerId) {
    return res.status(403).json({ message: "Forbidden" });
  }

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

  if (result.rows.length === 0) {
    return res.status(200).json({
      order_id: Number(req.params.id),
      total: "0",
    });
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
      ORDER BY product_id ASC
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
          (product_id, warehouse_id, movement_type, quantity, created_at, reference_id, reason)
        VALUES
          ($1, $2, 'SALE', $3, now(), $4, 'Order fulfillment')
        `,
        [item.product_id, order.warehouse_id, item.quantity, order.id],
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
