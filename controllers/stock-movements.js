const pg = require(`../config/db.js`);
const test = require(`../services/try-catch.js`);
const readAll = require(`../services/read-all.js`);
const readId = require(`../services/read-id.js`);
const deleteId = require(`../services/remove.js`);
const { one, two } = require(`../services/read-relation.js`);

const read = readAll(`stock_movements`);

const readOne = readId(`stock_movements`, `stock movement`);

const create = test(async (req, res) => {
  const { pid, wid, movementType, quantity } = req.body;

  const result = await pg.query(
    `
    INSERT INTO stock_movements
      (product_id, warehouse_id, movement_type, quantity, created_at)
    VALUES
      ($1, $2, $3, $4, now())
    RETURNING *
    `,
    [pid, wid, movementType, quantity],
  );

  res.status(201).json(result.rows[0]);
});

const remove = deleteId(`stock_movements`, `stock movement`);

const productMovements = one(
  `stock_movements`,
  `products`,
  `id`,
  `product_id`,
  `product_id`,
);

const warehouseMovements = one(
  `stock_movements`,
  `warehouses`,
  `id`,
  `warehouse_id`,
  `warehouse_id`,
);

const productWarehouseMovements = two(
  `stock_movements`,
  `products`,
  `product_id`,
  `id`,
  `warehouses`,
  `warehouse_id`,
  `id`,
  `product_id`,
);

module.exports = {
  read,
  readOne,
  create,
  remove,
  productMovements,
  warehouseMovements,
  productWarehouseMovements,
};
