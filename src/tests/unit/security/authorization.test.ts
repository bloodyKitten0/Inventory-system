import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import { hasPermission } from "../../../security/authorization.js";

const db = pg as unknown as { query: unknown; connect: unknown };

test("returns true when the account has the requested permission", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [{ "?column?": 1 }],
  });

  try {
    const result = await hasPermission(123, "product.read");

    assert.equal(result, true);
  } finally {
    db.query = originalQuery;
  }
});

test("returns false when the account does not have the requested permission", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  try {
    const result = await hasPermission(123, "product.read");

    assert.equal(result, false);
  } finally {
    db.query = originalQuery;
  }
});

test("returns false when the requested permission does not exist for the account", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  try {
    const result = await hasPermission(123, "permission.that.does.not.exist");

    assert.equal(result, false);
  } finally {
    db.query = originalQuery;
  }
});

test("passes the account ID and permission name to the database query", async () => {
  const originalQuery = db.query;

  let receivedParameters: any;

  db.query = async (query: string, parameters: unknown[]) => {
    receivedParameters = parameters;

    return {
      rows: [],
    };
  };

  try {
    await hasPermission(456, "inventory.adjust");

    assert.deepEqual(receivedParameters, [456, "inventory.adjust"]);
  } finally {
    db.query = originalQuery;
  }
});

test("propagates database errors", async () => {
  const originalQuery = db.query;

  const databaseError = new Error("Database connection failed");

  db.query = async () => {
    throw databaseError;
  };

  try {
    await assert.rejects(hasPermission(123, "product.read"), (error: unknown) => {
      assert.equal(error, databaseError);
      return true;
    });
  } finally {
    db.query = originalQuery;
  }
});

test("returns true when the database returns multiple matching rows", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [{ "?column?": 1 }, { "?column?": 1 }],
  });

  try {
    const result = await hasPermission(123, "product.read");

    assert.equal(result, true);
  } finally {
    db.query = originalQuery;
  }
});
