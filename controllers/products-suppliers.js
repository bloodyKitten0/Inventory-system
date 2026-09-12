const pg = require(`../config/db.js`);
const test = require(`../services/try-catch.js`);
const checkRow = require(`../services/rows-check.js`);
const readAll = require(`../services/read-all.js`);
const readId = require("../services/read-id.js");
const deleteId = require("../services/remove.js");
const { one } = require(`../services/read-relation.js`);

const read = readAll(`products_suppliers`);

const readOne = readId(`products_suppliers`, `relation`);

const create = test(async (req, res) => {
  const { pid, sid, spr, sku } = req.body;

  const result = await pg.query(
    `
    INSERT INTO products_suppliers
      (product_id, supplier_id, supplier_price, supplier_sku, created_at)
    VALUES
      ($1, $2, $3, $4, now())
    RETURNING *
    `,
    [pid, sid, spr, sku.trim()],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { pid, sid, spr, sku } = req.body;

  const result = await pg.query(
    `
    UPDATE products_suppliers
    SET
      product_id = $2,
      supplier_id = $3,
      supplier_price = $4,
      supplier_sku = $5
    WHERE id = $1
    RETURNING *
    `,
    [req.params.id, pid, sid, spr, sku.trim()],
  );

  if (!checkRow(result)) {
    return res.status(404).json("relation not found");
  }

  res.status(200).json(result.rows[0]);
});

const remove = deleteId(`products_suppliers`, `relation`);

const productsSupplier = one(
  `products_suppliers`,
  `suppliers`,
  `id`,
  `supplier_id`,
  `product_id`,
);

const supplierProducts = one(
  `products_suppliers`,
  `products`,
  `id`,
  `product_id`,
  `supplier_id`,
);

module.exports = {
  read,
  readOne,
  create,
  update,
  remove,
  productsSupplier,
  supplierProducts,
};
//
