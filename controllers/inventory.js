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
  if (!checkRow(result)) return res.status(404).json("inventory not found");
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
  const transaction = await pg.connect();

  try {
    await transaction.query(`BEGIN`);

    if (change === 0) {
      await transaction.query(`ROLLBACK`);
      return res.status(400).json("Change cannot be zero");
    }

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
    [req.params.below],
  );

  if (!checkRow(result))
    return res.status(404).json(`Nothing is below that limit`);

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
  if (!checkRow(result)) return res.status(404).json(`The inventory is empty`);

  res.status(200).json(result.rows);
});

const inventorySummaryOne = test(async (req, res) => {
  const result = await pg.query(
    `
  SELECT 
    product_id,SUM(amount) AS TOTAL
  FROM inventory
  WHERE product_id = $1
  GROUP BY product_id`,
    [req.params.id],
  );
  if (!checkRow(result)) return res.status(404).json(`The inventory is empty`);

  res.status(200).json(result.rows);
});

const checkAvailability = test(async (req, res) => {
  const { amount, pid, wid } = req.body;
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
  if (!checkRow(result)) return res.status(404).json(`Your input is not valid`);
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
