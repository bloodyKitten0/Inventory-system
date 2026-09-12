const { positiveInteger, requiredString } = require("./common");

const roleId = {
  params: {
    id: positiveInteger,
  },
};

const createRole = {
  body: {
    name: {
      ...requiredString(2),
    },
  },
};

const grantPermission = {
  params: {
    id: positiveInteger,
  },

  body: {
    permissionId: positiveInteger,
  },
};

const revokePermission = {
  params: {
    id: positiveInteger,
    permissionId: positiveInteger,
  },
};

const accountId = {
  params: {
    accountId: positiveInteger,
  },
};

const grantRole = {
  params: {
    accountId: positiveInteger,
  },

  body: {
    roleId: positiveInteger,
  },
};

const revokeRole = {
  params: {
    accountId: positiveInteger,
    roleId: positiveInteger,
  },
};

module.exports = {
  roleId,
  createRole,
  grantPermission,
  revokePermission,
  accountId,
  grantRole,
  revokeRole,
};
//
