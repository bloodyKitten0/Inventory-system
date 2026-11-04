import test from "../services/try-catch.js";
import pg from "../config/db.js";
import checkRow from "../services/rows-check.js";
import { withTransaction } from "../services/transaction.js";

const getOwnerRoleId = async (client?: any): Promise<number> => {
  const envId = Number(process.env.OWNER_ID);
  if (Number.isInteger(envId) && envId > 0) {
    return envId;
  }
  const db = client || pg;
  try {
    const res = await db.query(
      `SELECT role_id FROM roles WHERE LOWER(name) = 'owner' LIMIT 1`,
    );
    if (res.rows.length > 0 && res.rows[0].role_id) {
      return Number(res.rows[0].role_id);
    }
  } catch {
    // fallback
  }
  return 9;
};

const isOwnerRoleId = async (roleId: number, client?: any): Promise<boolean> => {
  const ownerId = await getOwnerRoleId(client);
  return roleId === ownerId;
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
  const result = await pg.query(
    `
    SELECT *
    FROM roles
    WHERE role_id = $1
    `,
    [req.params.id],
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

  try {
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
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({
        message: "Role already exists",
      });
    }
    throw err;
  }
});

const removeRole = test(async (req, res) => {
  const isOwner = await isOwnerRoleId(Number(req.params.id));
  if (isOwner) {
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
    [req.params.id],
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
    [req.params.id],
  );

  res.status(200).json(result.rows[0]);
});

const readRolePermissions = test(async (req, res) => {
  const role = await pg.query(
    `
    SELECT 1
    FROM roles
    WHERE role_id = $1
    `,
    [req.params.id],
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
    [req.params.id],
  );

  res.status(200).json(result.rows);
});

const grantPermission = test(async (req, res) => {
  const { permissionId } = req.body;

  const role = await pg.query(
    `
    SELECT 1
    FROM roles
    WHERE role_id = $1
    `,
    [req.params.id],
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

  try {
    const existing = await pg.query(
      `
      SELECT 1
      FROM role_permissions
      WHERE role_id = $1
        AND permission_id = $2
      `,
      [req.params.id, permissionId],
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
      [req.params.id, permissionId],
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({
        message: "Permission already granted to this role",
      });
    }
    throw err;
  }
});

const revokePermission = test(async (req, res) => {
  const isOwner = await isOwnerRoleId(Number(req.params.id));
  if (isOwner) {
    return res.status(403).json({
      message: "Permissions cannot be revoked from the owner role",
    });
  }

  const result = await pg.query(
    `
    DELETE FROM role_permissions
    WHERE role_id = $1
      AND permission_id = $2
    RETURNING *
    `,
    [req.params.id, req.params.permissionId],
  );

  if (!checkRow(result)) {
    return res.status(404).json({
      message: "Role-permission assignment not found",
    });
  }

  res.status(200).json(result.rows[0]);
});

const readAccountRoles = test(async (req, res) => {
  const account = await pg.query(
    `
    SELECT 1
    FROM accounts
    WHERE account_id = $1
    `,
    [req.params.accountId],
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
    [req.params.accountId],
  );

  res.status(200).json(result.rows);
});

const grantRole = test(async (req, res) => {
  const { roleId } = req.body;

  const account = await pg.query(
    `
    SELECT 1
    FROM accounts
    WHERE account_id = $1
    `,
    [req.params.accountId],
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

  try {
    const existing = await pg.query(
      `
      SELECT 1
      FROM account_roles
      WHERE account_id = $1
        AND role_id = $2
      `,
      [req.params.accountId, roleId],
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
      [req.params.accountId, roleId],
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({
        message: "Role already assigned to this account",
      });
    }
    throw err;
  }
});

const revokeRole = test(async (req, res) => {
  const isOwner = await isOwnerRoleId(Number(req.params.roleId));
  const ownerRoleId = await getOwnerRoleId();

  const outcome = await withTransaction(async (client) => {
    if (isOwner) {
      await client.query(
        `SELECT role_id FROM roles WHERE role_id = $1 FOR UPDATE`,
        [ownerRoleId],
      );

      const ownerCount = await client.query(
        `
        SELECT COUNT(*)::int AS count
        FROM account_roles
        WHERE role_id = $1
        `,
        [ownerRoleId],
      );

      if (ownerCount.rows[0]?.count <= 1) {
        return {
          status: 403,
          body: {
            message: "The last owner cannot be removed",
          },
        };
      }
    }

    const result = await client.query(
      `
      DELETE FROM account_roles
      WHERE account_id = $1 AND role_id = $2
      RETURNING *
      `,
      [req.params.accountId, req.params.roleId],
    );

    if (!checkRow(result)) {
      return {
        status: 404,
        body: {
          message: "Account-role assignment not found",
        },
      };
    }

    return {
      status: 200,
      body: result.rows[0],
    };
  });

  res.status(outcome.status).json(outcome.body);
});

export {
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
