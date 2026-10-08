import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import readAll from "../../../services/read-all.js";
import { asMockHandler } from "../../helpers.js";

const db = pg as unknown as { query: unknown; connect: unknown };

class ResponseBuilder {
  #statusCode: number | undefined;
  #responseBody: unknown;

  status(code: number) {
    this.#statusCode = code;
    return this;
  }

  json(body: unknown) {
    this.#responseBody = body;
    return this;
  }

  get statusCode() {
    return this.#statusCode;
  }

  get responseBody() {
    return this.#responseBody;
  }
}

test("returns all rows with status 200", async () => {
  const originalQuery = db.query;

  const rows = [
    { id: 1, name: "Product 1" },
    { id: 2, name: "Product 2" },
  ];

  db.query = async () => ({
    rows,
  });

  try {
    const middleware = readAll("products");

    const req = {};
    const res = new ResponseBuilder();

    await asMockHandler(middleware)(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.responseBody, rows);
  } finally {
    db.query = originalQuery;
  }
});

test("returns an empty array when no rows exist", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  try {
    const middleware = readAll("products");

    const res = new ResponseBuilder();

    await asMockHandler(middleware)({}, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.responseBody, []);
  } finally {
    db.query = originalQuery;
  }
});

test("uses the default SELECT query", async () => {
  const originalQuery = db.query;

  let receivedQuery: unknown;
  let receivedValues: unknown;

  db.query = async (query: string, values: unknown[]) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [],
    };
  };

  try {
    const middleware = readAll("products");

    await asMockHandler(middleware)({}, new ResponseBuilder(), () => {});

    assert.equal(receivedQuery, "SELECT * FROM products");

    assert.deepEqual(receivedValues, []);
  } finally {
    db.query = originalQuery;
  }
});

test("uses a custom query builder", async () => {
  const originalQuery = db.query;

  let builderReceivedReq: unknown;
  let receivedQuery: unknown;
  let receivedValues: unknown;

  const req = {
    params: {
      categoryId: 10,
    },
  };

  const build = (request: { params: Record<string, unknown> }) => {
    builderReceivedReq = request;

    return {
      query: "SELECT * FROM products WHERE category_id = $1",
      values: [request.params.categoryId],
    };
  };

  db.query = async (query: string, values: unknown[]) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [{ id: 1 }],
    };
  };

  try {
    const middleware = readAll("products", build);

    await asMockHandler(middleware)(req, new ResponseBuilder(), () => {});

    assert.equal(builderReceivedReq, req);

    assert.equal(
      receivedQuery,
      "SELECT * FROM products WHERE category_id = $1",
    );

    assert.deepEqual(receivedValues, [10]);
  } finally {
    db.query = originalQuery;
  }
});

test("passes database errors to next", async () => {
  const originalQuery = db.query;

  const error = new Error("Database failure");

  db.query = async () => {
    throw error;
  };

  let receivedError: unknown;

  try {
    const middleware = readAll("products");

    await asMockHandler(middleware)({}, new ResponseBuilder(), (err: unknown) => {
      receivedError = err;
    });

    assert.equal(receivedError, error);
  } finally {
    db.query = originalQuery;
  }
});
