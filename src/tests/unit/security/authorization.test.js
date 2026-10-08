const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const { hasPermission } = require("../../../security/authorization.js");

test("returns true when the account has the requested permission", async () => {
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

test("returns false when the account does not have the requested permission", async () => {
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

test("returns false when the requested permission does not exist for the account", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  try {
    const result = await hasPermission(123, "permission.that.does.not.exist");

    assert.equal(result, false);
  } finally {
    pg.query = originalQuery;
  }
});

test("passes the account ID and permission name to the database query", async () => {
  const originalQuery = pg.query;

  let receivedParameters;

  pg.query = async (query, parameters) => {
    receivedParameters = parameters;

    return {
      rows: [],
    };
  };

  try {
    await hasPermission(456, "inventory.adjust");

    assert.deepEqual(receivedParameters, [456, "inventory.adjust"]);
  } finally {
    pg.query = originalQuery;
  }
});

test("propagates database errors", async () => {
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

test("returns true when the database returns multiple matching rows", async () => {
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
