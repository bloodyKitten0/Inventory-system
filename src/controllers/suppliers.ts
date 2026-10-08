import pg from "../config/db.js";
import test from "../services/try-catch.js";
import checkRow from "../services/rows-check.js";
import readAll from "../services/read-all.js";
import readId from "../services/read-id.js";
import deleteId from "../services/remove.js";

const read = readAll(`suppliers`);

const readOne = readId("suppliers", "Supplier");

const create = test(async (req, res) => {
  const { supplier_name, supplier_email, supplier_phone } = req.body;

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

export {
  read,
  readOne,
  create,
  update,
  remove,
};
