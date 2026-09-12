const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const { hasPermission } = require("../../../security/authorization.js");
const requirePermission = require("../../../middlewares/authorization.js");

test("hasPermission returns true when the account has the requested permission", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [{ "?column?": 1 }],
  });

  try {
    const result = await hasPermission(123, "product.read");

    assert.equal(result, true);
  } finally {
    pg.query = originalQuery;
  }
});

test("hasPermission returns false when the account does not have the requested permission", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  try {
    const result = await hasPermission(123, "product.read");

    assert.equal(result, false);
  } finally {
    pg.query = originalQuery;
  }
});

test("hasPermission passes the account ID and permission name to the database query", async () => {
  const originalQuery = pg.query;

  let receivedQuery;
  let receivedParameters;

  pg.query = async (query, parameters) => {
    receivedQuery = query;
    receivedParameters = parameters;

    return {
      rows: [],
    };
  };

  try {
    await hasPermission(456, "inventory.adjust");

    assert.deepEqual(receivedParameters, [456, "inventory.adjust"]);

    assert.match(receivedQuery, /account_roles/);
    assert.match(receivedQuery, /role_permissions/);
    assert.match(receivedQuery, /permissions/);
    assert.match(receivedQuery, /ar\.account_id\s*=\s*\$1/);
    assert.match(receivedQuery, /p\.name\s*=\s*\$2/);
  } finally {
    pg.query = originalQuery;
  }
});

test("hasPermission returns true when multiple matching rows are returned", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [{ "?column?": 1 }, { "?column?": 1 }],
  });

  try {
    const result = await hasPermission(123, "product.read");

    assert.equal(result, true);
  } finally {
    pg.query = originalQuery;
  }
});

test("hasPermission propagates database errors", async () => {
  const originalQuery = pg.query;
  const databaseError = new Error("Database connection failed");

  pg.query = async () => {
    throw databaseError;
  };

  try {
    await assert.rejects(hasPermission(123, "product.read"), (error) => {
      assert.equal(error, databaseError);
      return true;
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("hasPermission accepts different permission names", async () => {
  const originalQuery = pg.query;

  const permissions = [
    "product.read",
    "product.create",
    "inventory.adjust",
    "customer.update",
    "order.remove",
  ];

  const receivedPermissions = [];

  pg.query = async (query, parameters) => {
    receivedPermissions.push(parameters[1]);

    return {
      rows: [],
    };
  };

  try {
    for (const permission of permissions) {
      await hasPermission(123, permission);
    }

    assert.deepEqual(receivedPermissions, permissions);
  } finally {
    pg.query = originalQuery;
  }
});

test("requirePermission calls next when the user has the required permission", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [{ "?column?": 1 }],
  });

  const middleware = requirePermission("product.read");

  const req = {
    user: {
      userId: 123,
    },
  };

  const res = {
    status() {
      throw new Error("status() should not be called");
    },

    json() {
      throw new Error("json() should not be called");
    },
  };

  let nextCalled = false;
  let nextError;

  const next = (error) => {
    nextCalled = true;
    nextError = error;
  };

  try {
    await middleware(req, res, next);

    assert.equal(nextCalled, true);
    assert.equal(nextError, undefined);
  } finally {
    pg.query = originalQuery;
  }
});

test("requirePermission returns 403 when the user lacks the required permission", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const middleware = requirePermission("product.read");

  const req = {
    user: {
      userId: 123,
    },
  };

  let statusCode;
  let responseBody;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },

    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  try {
    await middleware(req, res, next);

    assert.equal(statusCode, 403);
    assert.deepEqual(responseBody, {
      message: "Forbidden",
    });

    assert.equal(nextCalled, false);
  } finally {
    pg.query = originalQuery;
  }
});

test("requirePermission uses req.user.userId when checking permissions", async () => {
  const originalQuery = pg.query;

  let receivedParameters;

  pg.query = async (query, parameters) => {
    receivedParameters = parameters;

    return {
      rows: [],
    };
  };

  const middleware = requirePermission("inventory.adjust");

  const req = {
    user: {
      userId: 987,
    },
  };

  const res = {
    status(code) {
      assert.equal(code, 403);
      return this;
    },

    json(body) {
      assert.deepEqual(body, {
        message: "Forbidden",
      });

      return this;
    },
  };

  const next = () => {};

  try {
    await middleware(req, res, next);

    assert.deepEqual(receivedParameters, [987, "inventory.adjust"]);
  } finally {
    pg.query = originalQuery;
  }
});

test("requirePermission passes the requested permission name to hasPermission", async () => {
  const originalQuery = pg.query;

  let receivedPermission;

  pg.query = async (query, parameters) => {
    receivedPermission = parameters[1];

    return {
      rows: [],
    };
  };

  const middleware = requirePermission("customer.update");

  const req = {
    user: {
      userId: 123,
    },
  };

  const res = {
    status() {
      return this;
    },

    json() {
      return this;
    },
  };

  const next = () => {};

  try {
    await middleware(req, res, next);

    assert.equal(receivedPermission, "customer.update");
  } finally {
    pg.query = originalQuery;
  }
});

test("requirePermission forwards database errors to next", async () => {
  const originalQuery = pg.query;
  const databaseError = new Error("Database connection failed");

  pg.query = async () => {
    throw databaseError;
  };

  const middleware = requirePermission("product.read");

  const req = {
    user: {
      userId: 123,
    },
  };

  const res = {
    status() {
      throw new Error("status() should not be called");
    },

    json() {
      throw new Error("json() should not be called");
    },
  };

  let receivedError;

  const next = (error) => {
    receivedError = error;
  };

  try {
    await middleware(req, res, next);

    assert.equal(receivedError, databaseError);
  } finally {
    pg.query = originalQuery;
  }
});
//
