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
  if (typeof customer_name !== "string" || customer_name.trim().length < 2) {
    return res.status(400).json({
      message: "Invalid customer name",
    });
  }
  if (
    typeof customer_email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)
  ) {
    return res.status(400).json({
      message: "Invalid email",
    });
  }
  if (
    typeof shipping_address !== "string" ||
    shipping_address.trim().length < 5
  ) {
    return res.status(400).json({
      message: "Invalid shipping address",
    });
  }

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
  const { customer_email, shipping_address } = req.body;

  if (
    typeof customer_email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)
  ) {
    return res.status(400).json({
      message: "Invalid email",
    });
  }
  if (
    typeof shipping_address !== "string" ||
    shipping_address.trim().length < 5
  ) {
    return res.status(400).json({
      message: "Invalid shipping address",
    });
  }

  const result = await pg.query(
    `
    UPDATE customers
    SET
      customer_email = $2,
      shipping_address = $3
    WHERE customer_id = $1
    RETURNING *
    `,
    [req.params.id, customer_email, shipping_address],
  );
  if (!checkRow(result)) {
    return res.status(404).json("Customer not found");
  }
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
