import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import remove from "../../../services/remove.js";
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

test("returns 200 when a row is deleted", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [{ id: 1 }],
  });

  try {
    const middleware = remove("products", "Product");

    const res = new ResponseBuilder();

    await asMockHandler(middleware)(
      {
        params: {
          id: 1,
        },
      },
      res,
      () => {},
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.responseBody, "Product deleted");
  } finally {
    db.query = originalQuery;
  }
});

test("returns 404 when no row is deleted", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  try {
    const middleware = remove("products", "Product");

    const res = new ResponseBuilder();

    await asMockHandler(middleware)(
      {
        params: {
          id: 999,
        },
      },
      res,
      () => {},
    );

    assert.equal(res.statusCode, 404);
    assert.equal(res.responseBody, "Product not found");
  } finally {
    db.query = originalQuery;
  }
});

test("passes the request ID to the delete query", async () => {
  const originalQuery = db.query;

  let receivedQuery: any;
  let receivedValues: any;

  db.query = async (query: string, values: unknown[]) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [{ id: 42 }],
    };
  };

  try {
    const middleware = remove("products", "Product");

    await asMockHandler(middleware)(
      {
        params: {
          id: 42,
        },
      },
      new ResponseBuilder(),
      () => {},
    );

    assert.match(receivedQuery, /DELETE FROM products/);
    assert.match(receivedQuery, /WHERE id = \$1/);
    assert.match(receivedQuery, /RETURNING \*/);

    assert.deepEqual(receivedValues, [42]);
  } finally {
    db.query = originalQuery;
  }
});

test("supports a custom ID column", async () => {
  const originalQuery = db.query;

  let receivedQuery: any;
  let receivedValues: any;

  db.query = async (query: string, values: unknown[]) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [{ product_id: 42 }],
    };
  };

  try {
    const middleware = remove("products", "Product", "product_id");

    await asMockHandler(middleware)(
      {
        params: {
          id: 42,
        },
      },
      new ResponseBuilder(),
      () => {},
    );

    assert.match(receivedQuery, /WHERE product_id = \$1/);

    assert.deepEqual(receivedValues, [42]);
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

  let receivedError: any;

  try {
    const middleware = remove("products", "Product");

    await asMockHandler(middleware)({ params: { id: 1 } }, new ResponseBuilder(), (err: unknown) => {
      receivedError = err;
    });

    assert.equal(receivedError, error);
  } finally {
    db.query = originalQuery;
  }
});
