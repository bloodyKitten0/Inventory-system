const pg = require(`../config/db.js`);
const test = require(`../services/try-catch.js`);
const readAll = require(`../services/read-all.js`);
const readId = require(`../services/read-id.js`);
const { one, two } = require(`../services/read-relation.js`);

const read = readAll(`stock_movements`);

const readOne = readId(`stock_movements`, `stock movement`);

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
  productMovements,
  warehouseMovements,
  productWarehouseMovements,
};
