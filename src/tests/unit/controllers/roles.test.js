const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const controller = require("../../../controllers/roles.js");

const response = () => {
  let statusCode;
  let body;

  return {
    res: {
      status(code) {
        statusCode = code;
        return this;
      },

      json(value) {
        body = value;
        return this;
      },
    },

    get statusCode() {
      return statusCode;
    },

    get body() {
      return body;
    },
  };
};

test("exports all role controller functions", () => {
  for (const name of [
    "readRoles",
    "readRole",
    "createRole",
    "removeRole",
    "readRolePermissions",
    "grantPermission",
    "revokePermission",
    "readAccountRoles",
    "grantRole",
    "revokeRole",
  ]) {
    assert.equal(typeof controller[name], "function");
  }
});

test("readRoles returns all roles", async () => {
  const originalQuery = pg.query;

  const rows = [
    { role_id: 1, name: "Owner" },
    { role_id: 2, name: "Manager" },
  ];

  pg.query = async () => ({
    rows,
  });

  const result = response();

  try {
    await controller.readRoles({}, result.res, () => {});

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, rows);
  } finally {
    pg.query = originalQuery;
  }
});

test("readRole returns a role when found", async () => {
  const originalQuery = pg.query;

  const role = {
    role_id: 2,
    name: "Manager",
  };

  pg.query = async () => ({
    rows: [role],
  });

  const result = response();

  try {
    await controller.readRole(
      {
        params: { id: 2 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, role);
  } finally {
    pg.query = originalQuery;
  }
});

test("readRole returns 404 when role does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.readRole(
      {
        params: { id: 999 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Role not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("createRole creates a role", async () => {
  const originalQuery = pg.query;

  const calls = [];

  pg.query = async (query, values) => {
    calls.push({ query, values });

    if (query.includes("SELECT 1")) {
      return {
        rows: [],
      };
    }

    return {
      rows: [
        {
          role_id: 5,
          name: "Inventory Manager",
        },
      ],
    };
  };

  const result = response();

  try {
    await controller.createRole(
      {
        body: {
          name: " Inventory Manager ",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, {
      role_id: 5,
      name: "Inventory Manager",
    });

    assert.deepEqual(calls[0].values, ["Inventory Manager"]);
  } finally {
    pg.query = originalQuery;
  }
});

test("createRole rejects duplicate roles", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [{ "?column?": 1 }],
  });

  const result = response();

  try {
    await controller.createRole(
      {
        body: {
          name: "Owner",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 409);
    assert.deepEqual(result.body, {
      message: "Role already exists",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("removeRole refuses to delete the owner role", async () => {
  const originalQuery = pg.query;

  const result = response();

  try {
    await controller.removeRole(
      {
        params: {
          id: process.env.OWNER_ID,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 403);
    assert.deepEqual(result.body, {
      message: "The owner role cannot be deleted",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("removeRole returns 404 when role does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.removeRole(
      {
        params: { id: 999 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Role not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("removeRole deletes an existing non-owner role", async () => {
  const originalQuery = pg.query;

  let call = 0;

  pg.query = async () => {
    call++;

    if (call === 1) {
      return {
        rows: [{ role_id: 5 }],
      };
    }

    return {
      rows: [{ role_id: 5, name: "Temporary" }],
    };
  };

  const result = response();

  try {
    await controller.removeRole(
      {
        params: { id: 5 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      role_id: 5,
      name: "Temporary",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("readRolePermissions returns permissions for a role", async () => {
  const originalQuery = pg.query;

  let call = 0;

  pg.query = async () => {
    call++;

    if (call === 1) {
      return {
        rows: [{ "?column?": 1 }],
      };
    }

    return {
      rows: [
        {
          permission_id: 1,
          name: "product.read",
        },
      ],
    };
  };

  const result = response();

  try {
    await controller.readRolePermissions(
      {
        params: { id: 2 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, [
      {
        permission_id: 1,
        name: "product.read",
      },
    ]);
  } finally {
    pg.query = originalQuery;
  }
});

test("readRolePermissions returns 404 when role does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.readRolePermissions(
      {
        params: { id: 999 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Role not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("grantPermission returns 404 when role does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.grantPermission(
      {
        params: { id: 999 },
        body: { permissionId: 1 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Role not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("grantPermission returns 404 when permission does not exist", async () => {
  const originalQuery = pg.query;

  let call = 0;

  pg.query = async () => {
    call++;

    if (call === 1) {
      return {
        rows: [{ "?column?": 1 }],
      };
    }

    return {
      rows: [],
    };
  };

  const result = response();

  try {
    await controller.grantPermission(
      {
        params: { id: 2 },
        body: { permissionId: 999 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Permission not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("grantPermission rejects an existing assignment", async () => {
  const originalQuery = pg.query;

  let call = 0;

  pg.query = async () => {
    call++;

    if (call < 3) {
      return {
        rows: [{ "?column?": 1 }],
      };
    }

    return {
      rows: [{ "?column?": 1 }],
    };
  };

  const result = response();

  try {
    await controller.grantPermission(
      {
        params: { id: 2 },
        body: { permissionId: 5 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 409);
    assert.deepEqual(result.body, {
      message: "Permission already granted to this role",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("grantPermission creates a new role-permission assignment", async () => {
  const originalQuery = pg.query;

  let call = 0;

  pg.query = async () => {
    call++;

    // 1. Role exists
    if (call === 1) {
      return {
        rows: [{ "?column?": 1 }],
      };
    }

    // 2. Permission exists
    if (call === 2) {
      return {
        rows: [{ "?column?": 1 }],
      };
    }

    // 3. Assignment does not already exist
    if (call === 3) {
      return {
        rows: [],
      };
    }

    // 4. INSERT
    return {
      rows: [
        {
          role_id: 2,
          permission_id: 5,
        },
      ],
    };
  };

  const result = response();

  try {
    await controller.grantPermission(
      {
        params: { id: 2 },
        body: { permissionId: 5 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, {
      role_id: 2,
      permission_id: 5,
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("revokePermission returns 404 when assignment does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.revokePermission(
      {
        params: {
          id: 2,
          permissionId: 5,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Role-permission assignment not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("revokePermission removes an assignment", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [
      {
        role_id: 2,
        permission_id: 5,
      },
    ],
  });

  const result = response();

  try {
    await controller.revokePermission(
      {
        params: {
          id: 2,
          permissionId: 5,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      role_id: 2,
      permission_id: 5,
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("readAccountRoles returns account roles", async () => {
  const originalQuery = pg.query;

  let call = 0;

  pg.query = async () => {
    call++;

    if (call === 1) {
      return {
        rows: [{ "?column?": 1 }],
      };
    }

    return {
      rows: [
        {
          role_id: 2,
          name: "Manager",
        },
      ],
    };
  };

  const result = response();

  try {
    await controller.readAccountRoles(
      {
        params: { accountId: 10 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, [
      {
        role_id: 2,
        name: "Manager",
      },
    ]);
  } finally {
    pg.query = originalQuery;
  }
});

test("readAccountRoles returns 404 when account does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.readAccountRoles(
      {
        params: { accountId: 999 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Account not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("grantRole returns 404 when account does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.grantRole(
      {
        params: { accountId: 999 },
        body: { roleId: 2 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Account not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("grantRole returns 404 when role does not exist", async () => {
  const originalQuery = pg.query;

  let call = 0;

  pg.query = async () => {
    call++;

    if (call === 1) {
      return {
        rows: [{ "?column?": 1 }],
      };
    }

    return {
      rows: [],
    };
  };

  const result = response();

  try {
    await controller.grantRole(
      {
        params: { accountId: 10 },
        body: { roleId: 999 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Role not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("grantRole rejects an existing account-role assignment", async () => {
  const originalQuery = pg.query;

  let call = 0;

  pg.query = async () => {
    call++;

    return {
      rows: [{ "?column?": 1 }],
    };
  };

  const result = response();

  try {
    await controller.grantRole(
      {
        params: { accountId: 10 },
        body: { roleId: 2 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 409);
    assert.deepEqual(result.body, {
      message: "Role already assigned to this account",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("grantRole creates an account-role assignment", async () => {
  const originalQuery = pg.query;

  let call = 0;

  pg.query = async () => {
    call++;

    // 1. Account exists
    if (call === 1) {
      return {
        rows: [{ "?column?": 1 }],
      };
    }

    // 2. Role exists
    if (call === 2) {
      return {
        rows: [{ "?column?": 1 }],
      };
    }

    // 3. Assignment does not already exist
    if (call === 3) {
      return {
        rows: [],
      };
    }

    // 4. INSERT
    return {
      rows: [
        {
          account_id: 10,
          role_id: 2,
        },
      ],
    };
  };

  const result = response();

  try {
    await controller.grantRole(
      {
        params: { accountId: 10 },
        body: { roleId: 2 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, {
      account_id: 10,
      role_id: 2,
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("revokeRole prevents removal of the last owner", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [
      {
        count: 1,
      },
    ],
  });

  const result = response();

  try {
    await controller.revokeRole(
      {
        params: {
          accountId: 10,
          roleId: process.env.OWNER_ID,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 403);
    assert.deepEqual(result.body, {
      message: "The last owner cannot be removed",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("revokeRole returns 404 when assignment does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.revokeRole(
      {
        params: {
          accountId: 10,
          roleId: 2,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Account-role assignment not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("revokeRole removes a normal account-role assignment", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [
      {
        account_id: 10,
        role_id: 2,
      },
    ],
  });

  const result = response();

  try {
    await controller.revokeRole(
      {
        params: {
          accountId: 10,
          roleId: 2,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      account_id: 10,
      role_id: 2,
    });
  } finally {
    pg.query = originalQuery;
  }
});
