const pg = require("../config/db.js");

const hasPermission = async (accountId, permissionName) => {
  const result = await pg.query(
    `SELECT 1
     FROM account_roles ar
     JOIN role_permissions rp
       ON rp.role_id = ar.role_id
     JOIN permissions p
       ON p.permission_id = rp.permission_id
     WHERE ar.account_id = $1
       AND p.name = $2;`,
    [accountId, permissionName],
  );

  return result.rows.length > 0;
};

module.exports = { hasPermission };
//
