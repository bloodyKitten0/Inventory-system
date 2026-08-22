const pg = require("../config/db.js");
const test = require("../services/try-catch.js");
const checkRow = require("../services/rows-check.js");
const readAll = require(`../services/read-all.js`);
const readId = require("../services/read-id.js");
const deleteId = require("../services/remove.js");

const read = readAll(`customers`);

const readOne = readId("customers", "Customer");

const create = test(async (req, res) => {
  const { customer_name, customer_email, shipping_address } = req.body;

  const result = await pg.query(
    `
    INSERT INTO customers
        (customer_name, customer_email, shipping_address, created_at)
    VALUES
        ($1, $2, $3, now())
    RETURNING *
    `,
    [customer_name, customer_email, shipping_address],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { customer_email, customer_address } = req.body;

  const result = await pg.query(
    `
    UPDATE customers
    SET
      customer_email = $2,
      customer_address = $3
    WHERE customer_id = $1
    RETURNING *
    `,
    [req.params.id, customer_email, customer_address],
  );

  if (!checkRow(result)) return res.status(404).json("Customer not found");

  res.status(200).json(result.rows[0]);
});

const remove = deleteId(`customers`, "Customer");

module.exports = {
  read,
  readOne,
  create,
  update,
  remove,
};
