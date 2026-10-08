import pg from "../config/db.js";
import test from "../services/try-catch.js";
import checkRow from "../services/rows-check.js";
import readAll from "../services/read-all.js";
import readId from "../services/read-id.js";
import deleteId from "../services/remove.js";
import { two } from "../services/read-relation.js";

const read = readAll("inventory");

const readOne = readId("inventory", "inventory");

const create = test(async (req, res) => {
  const { product_id, warehouse_id, quantity } = req.body;

  const result = await pg.query(
    `
    INSERT INTO inventory
      (product_id, warehouse_id, amount, last_update)
    VALUES
      ($1, $2, $3, now())
    RETURNING *
    `,
    [product_id, warehouse_id, quantity],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { product_id, warehouse_id, quantity } = req.body;

  const result = await pg.query(
    `
    UPDATE inventory
    SET
      product_id = $2,
      warehouse_id = $3,
      amount = $4,
      last_update = now()
    WHERE id = $1
    RETURNING *
    `,
    [req.params.id, product_id, warehouse_id, quantity],
  );

  if (!checkRow(result)) {
    return res.status(404).json({
      message: "Inventory not found",
    });
  }

  res.status(200).json(result.rows[0]);
});

const remove = deleteId("inventory", "inventory");

const productInventory = two(
  "inventory",
  "products",
  "product_id",
  "id",
  "warehouses",
  "warehouse_id",
  "id",
  "product_id",
);

const warehouseInventory = two(
  "inventory",
  "products",
  "product_id",
  "id",
  "warehouses",
  "warehouse_id",
  "id",
  "warehouse_id",
);

const adjustStock = test(async (req, res) => {
  const { change } = req.body;

  const transaction = await pg.connect();

  try {
    await transaction.query("BEGIN");

    const result = await transaction.query(
      `
      SELECT *
      FROM inventory
      WHERE id = $1
      FOR UPDATE
      `,
      [req.params.id],
    );

    if (!checkRow(result)) {
      await transaction.query("ROLLBACK");

      return res.status(404).json({
        message: "Inventory not found",
      });
    }

    const inventory = result.rows[0];

    if (inventory.amount + change < 0) {
      await transaction.query("ROLLBACK");

      return res.status(400).json({
        message: "Not enough stock",
      });
    }

    const updated = await transaction.query(
      `
      UPDATE inventory
      SET
        amount = amount + $1,
        last_update = now()
      WHERE id = $2
      RETURNING *
      `,
      [change, req.params.id],
    );

    const movement = change > 0 ? "RECEIPT" : "SALE";

    await transaction.query(
      `
      INSERT INTO stock_movements
        (product_id, warehouse_id, movement_type, quantity, created_at)
      VALUES
        ($1, $2, $3, $4, now())
      `,
      [
        inventory.product_id,
        inventory.warehouse_id,
        movement,
        Math.abs(change),
      ],
    );

    await transaction.query("COMMIT");

    res.status(200).json(updated.rows[0]);
  } catch (e) {
    await transaction.query("ROLLBACK");
    throw e;
  } finally {
    transaction.release();
  }
});

const lowStock = test(async (req, res) => {
  const below = Number(req.params.below);

  const result = await pg.query(
    `
    SELECT
      product_id,
      SUM(amount) AS total_amount
    FROM inventory
    GROUP BY product_id
    HAVING SUM(amount) < $1
    ORDER BY product_id
    `,
    [below],
  );

  if (!checkRow(result)) {
    return res.status(404).json({
      message: "Nothing is below that limit",
    });
  }

  res.status(200).json(result.rows);
});

const inventorySummary = test(async (req, res) => {
  const result = await pg.query(
    `
    SELECT
      product_id,
      SUM(amount) AS total
    FROM inventory
    GROUP BY product_id
    ORDER BY product_id
    `,
  );

  if (!checkRow(result)) {
    return res.status(404).json({
      message: "The inventory is empty",
    });
  }

  res.status(200).json(result.rows);
});

const inventorySummaryOne = test(async (req, res) => {
  const productId = Number(req.params.id);

  const result = await pg.query(
    `
    SELECT
      product_id,
      SUM(amount) AS total
    FROM inventory
    WHERE product_id = $1
    GROUP BY product_id
    `,
    [productId],
  );

  if (!checkRow(result)) {
    return res.status(404).json({
      message: "The inventory is empty",
    });
  }

  res.status(200).json(result.rows);
});

const checkAvailability = test(async (req, res) => {
  const { quantity, product_id, warehouse_id } = req.body;

  const result = await pg.query(
    `
    SELECT
      product_id,
      warehouse_id,
      amount,
      CASE
        WHEN amount >= $1
        THEN 'Available'
        ELSE 'Not available'
      END AS available
    FROM inventory
    WHERE
      product_id = $2
      AND warehouse_id = $3
    `,
    [quantity, product_id, warehouse_id],
  );

  if (!checkRow(result)) {
    return res.status(404).json({
      message: "Inventory not found",
    });
  }

  res.status(200).json(result.rows);
});

export {
  read,
  readOne,
  create,
  update,
  remove,
  productInventory,
  warehouseInventory,
  adjustStock,
  lowStock,
  inventorySummary,
  inventorySummaryOne,
  checkAvailability,
};
