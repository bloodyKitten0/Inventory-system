const pg = require("../config/db.js");
const test = require("../services/try-catch.js");
const checkRow = require("../services/rows-check.js");
const readAll = require(`../services/read-all.js`);
const readId = require("../services/read-id.js");
const deleteId = require("../services/remove.js");

const read = readAll(`suppliers`);

const readOne = readId("suppliers", "Supplier");

const create = test(async (req, res) => {
  const { supplier_name, supplier_email, supplier_phone } = req.body;

  if (typeof supplier_name !== "string" || supplier_name.trim().length < 2) {
    return res.status(400).json({
      message: "Invalid supplier name",
    });
  }
  if (
    typeof supplier_email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier_email)
  ) {
    return res.status(400).json({
      message: "Invalid supplier email",
    });
  }
  if (typeof supplier_phone !== "string" || supplier_phone.trim().length < 7) {
    return res.status(400).json({
      message: "Invalid supplier phone",
    });
  }

  const result = await pg.query(
    `
    INSERT INTO suppliers
      (supplier_name, supplier_email, supplier_phone, created_at, updated_at)
    VALUES
      ($1, $2, $3, now(), now())
    RETURNING *
    `,
    [supplier_name.trim(), supplier_email.trim(), supplier_phone.trim()],
  );

  res.status(201).json(result.rows[0]);
});

const update = test(async (req, res) => {
  const { supplier_name, supplier_email, supplier_phone } = req.body;

  if (typeof supplier_name !== "string" || supplier_name.trim().length < 2) {
    return res.status(400).json({
      message: "Invalid supplier name",
    });
  }
  if (
    typeof supplier_email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier_email)
  ) {
    return res.status(400).json({
      message: "Invalid supplier email",
    });
  }
  if (typeof supplier_phone !== "string" || supplier_phone.trim().length < 7) {
    return res.status(400).json({
      message: "Invalid supplier phone",
    });
  }

  const result = await pg.query(
    `
    UPDATE suppliers
    SET
      supplier_name = $2,
      supplier_email = $3,
      supplier_phone = $4,
      updated_at = now()
    WHERE id = $1
    RETURNING *
    `,
    [
      req.params.id,
      supplier_name.trim(),
      supplier_email.trim(),
      supplier_phone.trim(),
    ],
  );

  if (!checkRow(result)) {
    return res.status(404).json("Supplier not found");
  }

  res.status(200).json(result.rows[0]);
});

const remove = deleteId(`suppliers`, "Supplier");

module.exports = {
  read,
  readOne,
  create,
  update,
  remove,
};
