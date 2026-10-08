import { positiveInteger, requiredString } from "./common.js";

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

export {
  roleId,
  createRole,
  grantPermission,
  revokePermission,
  accountId,
  grantRole,
  revokeRole,
};
