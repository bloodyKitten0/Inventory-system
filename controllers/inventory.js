const pg = require(`../config/db.js`);
const test = require(`../services/try-catch.js`);
const checkRow = require(`../services/rows-check.js`);
const readAll = require(`../services/read-all.js`);
const readId = require("../services/read-id.js");
const deleteId = require("../services/remove.js");
const { two } = require(`../services/read-relation.js`);

const read = readAll(`inventory`);

const readOne = readId(`inventory`, `inventory`);

const create = test(async (req, res) => {
  const { pid, wid, amo } = req.body;

  if (!Number.isInteger(pid) || pid <= 0) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  }

  if (!Number.isInteger(wid) || wid <= 0) {
    return res.status(400).json({
      message: "Invalid warehouse ID",
    });
  }

  if (typeof amo !== "number" || !Number.isFinite(amo) || amo < 0) {
    return res.status(400).json({
      message: "Invalid inventory amount",
    });
  }

  const result = await pg.query(
    `
        INSERT INTO inventory (product_id,warehouse_id,amount,last_update)
        VALUES($1,$2,$3,now())
        RETURNING *`,
    [pid, wid, amo],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { pid, wid, amo } = req.body;

  if (!Number.isInteger(pid) || pid <= 0) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  }

  if (!Number.isInteger(wid) || wid <= 0) {
    return res.status(400).json({
      message: "Invalid warehouse ID",
    });
  }

  if (typeof amo !== "number" || !Number.isFinite(amo) || amo < 0) {
    return res.status(400).json({
      message: "Invalid inventory amount",
    });
  }

  if (!Number.isInteger(Number(req.params.id)) || Number(req.params.id) <= 0) {
    return res.status(400).json({
      message: "Invalid inventory ID",
    });
  }

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
    [req.params.id, pid, wid, amo],
  );

  if (!checkRow(result)) {
    return res.status(404).json("inventory not found");
  }

  res.status(200).json(result.rows[0]);
});

const remove = deleteId(`inventory`, `inventory`);

const productInventory = two(
  `inventory`,
  `products`,
  `product_id`,
  `id`,
  `warehouses`,
  `warehouse_id`,
  `id`,
  `product_id`,
);

const warehouseInventory = two(
  `inventory`,
  `products`,
  `product_id`,
  `id`,
  `warehouses`,
  `warehouse_id`,
  `id`,
  `warehouse_id`,
);

const adjustStock = test(async (req, res) => {
  const { change } = req.body;

  if (!Number.isInteger(Number(req.params.id)) || Number(req.params.id) <= 0) {
    return res.status(400).json({
      message: "Invalid inventory ID",
    });
  }

  if (typeof change !== "number" || !Number.isFinite(change) || change === 0) {
    return res.status(400).json({
      message: "Change must be a finite non-zero number",
    });
  }

  const transaction = await pg.connect();

  try {
    await transaction.query(`BEGIN`);

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
      await transaction.query(`ROLLBACK`);
      return res.status(404).json("inventory not found");
    }

    const inventory = result.rows[0];

    if (inventory.amount + change < 0) {
      await transaction.query(`ROLLBACK`);
      return res.status(400).json("Not enough stock");
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

    await transaction.query(`COMMIT`);

    res.status(200).json(updated.rows[0]);
  } catch (e) {
    await transaction.query(`ROLLBACK`);
    throw e;
  } finally {
    transaction.release();
  }
});

const lowStock = test(async (req, res) => {
  const below = Number(req.params.below);

  if (!Number.isFinite(below) || below < 0) {
    return res.status(400).json({
      message: "Invalid stock threshold",
    });
  }

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
    return res.status(404).json(`Nothing is below that limit`);
  }

  res.status(200).json(result.rows);
});

const inventorySummary = test(async (req, res) => {
  const result = await pg.query(
    `
    SELECT 
      product_id,SUM(amount) AS TOTAL
    FROM inventory
    GROUP BY product_id
    ORDER BY product_id`,
  );

  if (!checkRow(result)) {
    return res.status(404).json(`The inventory is empty`);
  }

  res.status(200).json(result.rows);
});

const inventorySummaryOne = test(async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  }

  const result = await pg.query(
    `
    SELECT 
      product_id,SUM(amount) AS TOTAL
    FROM inventory
    WHERE product_id = $1
    GROUP BY product_id`,
    [productId],
  );

  if (!checkRow(result)) {
    return res.status(404).json(`The inventory is empty`);
  }

  res.status(200).json(result.rows);
});

const checkAvailability = test(async (req, res) => {
  const { amount, pid, wid } = req.body;

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({
      message: "Invalid amount",
    });
  }

  if (!Number.isInteger(pid) || pid <= 0) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  }

  if (!Number.isInteger(wid) || wid <= 0) {
    return res.status(400).json({
      message: "Invalid warehouse ID",
    });
  }

  const result = await pg.query(
    `
    SELECT
      product_id,warehouse_id,amount,CASE
        WHEN amount >= $1
        THEN 'Available'
        ELSE 'Not available'
      END AS available
    FROM inventory
    WHERE
        product_id = $2
        AND warehouse_id = $3
    `,
    [amount, pid, wid],
  );

  if (!checkRow(result)) {
    return res.status(404).json(`Inventory not found`);
  }

  res.status(200).json(result.rows);
});

module.exports = {
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
