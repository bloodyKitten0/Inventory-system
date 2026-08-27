const test = require("../services/try-catch.js");
const pg = require("../config/db.js");
const checkRow = require("../services/rows-check.js");

const OWNER_ROLE_ID = Number(process.env.OWNER_ID);
if (!Number.isInteger(OWNER_ROLE_ID) || OWNER_ROLE_ID <= 0) {
  throw new Error("OWNER_ID must be a valid positive integer");
}

const parsePositiveInt = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const readRoles = test(async (req, res) => {
  const result = await pg.query(`
    SELECT *
    FROM roles
    ORDER BY role_id
  `);

  res.status(200).json(result.rows);
});

const readRole = test(async (req, res) => {
  const roleId = parsePositiveInt(req.params.id);

  if (!roleId) {
    return res.status(400).json({
      message: "Invalid role ID",
    });
  }

  const result = await pg.query(
    `
    SELECT *
    FROM roles
    WHERE role_id = $1
    `,
    [roleId],
  );

  if (!checkRow(result)) {
    return res.status(404).json({
      message: "Role not found",
    });
  }

  res.status(200).json(result.rows[0]);
});

const createRole = test(async (req, res) => {
  const { name } = req.body;

  if (typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({
      message: "Invalid role name",
    });
  }

  const existing = await pg.query(
    `
    SELECT 1
    FROM roles
    WHERE name = $1
    `,
    [name.trim()],
  );

  if (checkRow(existing)) {
    return res.status(409).json({
      message: "Role already exists",
    });
  }

  const result = await pg.query(
    `
    INSERT INTO roles(name)
    VALUES ($1)
    RETURNING *
    `,
    [name.trim()],
  );

  res.status(201).json(result.rows[0]);
});

const removeRole = test(async (req, res) => {
  const roleId = parsePositiveInt(req.params.id);

  if (!roleId) {
    return res.status(400).json({
      message: "Invalid role ID",
    });
  }

  if (roleId === OWNER_ROLE_ID) {
    return res.status(403).json({
      message: "The owner role cannot be deleted",
    });
  }

  const role = await pg.query(
    `
    SELECT *
    FROM roles
    WHERE role_id = $1
    `,
    [roleId],
  );

  if (!checkRow(role)) {
    return res.status(404).json({
      message: "Role not found",
    });
  }

  const result = await pg.query(
    `
    DELETE FROM roles
    WHERE role_id = $1
    RETURNING *
    `,
    [roleId],
  );

  res.status(200).json(result.rows[0]);
});

const readRolePermissions = test(async (req, res) => {
  const roleId = parsePositiveInt(req.params.id);

  if (!roleId) {
    return res.status(400).json({
      message: "Invalid role ID",
    });
  }

  const role = await pg.query(
    `
    SELECT 1
    FROM roles
    WHERE role_id = $1
    `,
    [roleId],
  );

  if (!checkRow(role)) {
    return res.status(404).json({
      message: "Role not found",
    });
  }

  const result = await pg.query(
    `
    SELECT p.*
    FROM role_permissions rp
    JOIN permissions p
      ON p.permission_id = rp.permission_id
    WHERE rp.role_id = $1
    ORDER BY p.permission_id
    `,
    [roleId],
  );

  res.status(200).json(result.rows);
});

const grantPermission = test(async (req, res) => {
  const roleId = parsePositiveInt(req.params.id);
  const permissionId = parsePositiveInt(req.body.permissionId);

  if (!roleId) {
    return res.status(400).json({
      message: "Invalid role ID",
    });
  }

  if (!permissionId) {
    return res.status(400).json({
      message: "Invalid permission ID",
    });
  }

  const role = await pg.query(
    `
    SELECT 1
    FROM roles
    WHERE role_id = $1
    `,
    [roleId],
  );

  if (!checkRow(role)) {
    return res.status(404).json({
      message: "Role not found",
    });
  }

  const permission = await pg.query(
    `
    SELECT 1
    FROM permissions
    WHERE permission_id = $1
    `,
    [permissionId],
  );

  if (!checkRow(permission)) {
    return res.status(404).json({
      message: "Permission not found",
    });
  }

  const existing = await pg.query(
    `
    SELECT 1
    FROM role_permissions
    WHERE role_id = $1
      AND permission_id = $2
    `,
    [roleId, permissionId],
  );

  if (checkRow(existing)) {
    return res.status(409).json({
      message: "Permission already granted to this role",
    });
  }

  const result = await pg.query(
    `
    INSERT INTO role_permissions(role_id, permission_id)
    VALUES ($1, $2)
    RETURNING *
    `,
    [roleId, permissionId],
  );

  res.status(201).json(result.rows[0]);
});

const revokePermission = test(async (req, res) => {
  const roleId = parsePositiveInt(req.params.id);
  const permissionId = parsePositiveInt(req.params.permissionId);

  if (!roleId) {
    return res.status(400).json({
      message: "Invalid role ID",
    });
  }

  if (!permissionId) {
    return res.status(400).json({
      message: "Invalid permission ID",
    });
  }

  const result = await pg.query(
    `
    DELETE FROM role_permissions
    WHERE role_id = $1
      AND permission_id = $2
    RETURNING *
    `,
    [roleId, permissionId],
  );

  if (!checkRow(result)) {
    return res.status(404).json({
      message: "Role-permission assignment not found",
    });
  }

  res.status(200).json(result.rows[0]);
});

const readAccountRoles = test(async (req, res) => {
  const accountId = parsePositiveInt(req.params.accountId);

  if (!accountId) {
    return res.status(400).json({
      message: "Invalid account ID",
    });
  }

  const account = await pg.query(
    `
    SELECT 1
    FROM accounts
    WHERE account_id = $1
    `,
    [accountId],
  );

  if (!checkRow(account)) {
    return res.status(404).json({
      message: "Account not found",
    });
  }

  const result = await pg.query(
    `
    SELECT r.*
    FROM account_roles ar
    JOIN roles r
      ON r.role_id = ar.role_id
    WHERE ar.account_id = $1
    ORDER BY r.role_id
    `,
    [accountId],
  );

  res.status(200).json(result.rows);
});

const grantRole = test(async (req, res) => {
  const accountId = parsePositiveInt(req.params.accountId);
  const roleId = parsePositiveInt(req.body.roleId);

  if (!accountId) {
    return res.status(400).json({
      message: "Invalid account ID",
    });
  }

  if (!roleId) {
    return res.status(400).json({
      message: "Invalid role ID",
    });
  }

  const account = await pg.query(
    `
    SELECT 1
    FROM accounts
    WHERE account_id = $1
    `,
    [accountId],
  );

  if (!checkRow(account)) {
    return res.status(404).json({
      message: "Account not found",
    });
  }

  const role = await pg.query(
    `
    SELECT 1
    FROM roles
    WHERE role_id = $1
    `,
    [roleId],
  );

  if (!checkRow(role)) {
    return res.status(404).json({
      message: "Role not found",
    });
  }

  const existing = await pg.query(
    `
    SELECT 1
    FROM account_roles
    WHERE account_id = $1
      AND role_id = $2
    `,
    [accountId, roleId],
  );

  if (checkRow(existing)) {
    return res.status(409).json({
      message: "Role already assigned to this account",
    });
  }

  const result = await pg.query(
    `
    INSERT INTO account_roles(account_id, role_id)
    VALUES ($1, $2)
    RETURNING *
    `,
    [accountId, roleId],
  );

  res.status(201).json(result.rows[0]);
});

const revokeRole = test(async (req, res) => {
  const accountId = parsePositiveInt(req.params.accountId);
  const roleId = parsePositiveInt(req.params.roleId);

  if (!accountId) {
    return res.status(400).json({
      message: "Invalid account ID",
    });
  }

  if (!roleId) {
    return res.status(400).json({
      message: "Invalid role ID",
    });
  }

  if (roleId === OWNER_ROLE_ID) {
    const ownerCount = await pg.query(
      `
      SELECT COUNT(*)::int AS count
      FROM account_roles
      WHERE role_id = $1
      `,
      [OWNER_ROLE_ID],
    );

    if (ownerCount.rows[0].count <= 1) {
      return res.status(403).json({
        message: "The last owner cannot be removed",
      });
    }
  }

  const result = await pg.query(
    `
    DELETE FROM account_roles
    WHERE account_id = $1
      AND role_id = $2
    RETURNING *
    `,
    [accountId, roleId],
  );

  if (!checkRow(result)) {
    return res.status(404).json({
      message: "Account-role assignment not found",
    });
  }

  res.status(200).json(result.rows[0]);
});

module.exports = {
  readRoles,
  readRole,
  createRole,
  removeRole,
  readRolePermissions,
  grantPermission,
  revokePermission,
  readAccountRoles,
  grantRole,
  revokeRole,
};
