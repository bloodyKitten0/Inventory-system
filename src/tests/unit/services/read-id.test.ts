import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import readId from "../../../services/read-id.js";
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

test("returns the first row with status 200", async () => {
  const originalQuery = db.query;

  const rows = [
    { id: 10, name: "Product 10" },
    { id: 11, name: "Product 11" },
  ];

  db.query = async () => ({
    rows,
  });

  try {
    const middleware = readId("products", "Product");

    const req = {
      params: {
        id: 10,
      },
    };

    const res = new ResponseBuilder();

    await asMockHandler(middleware)(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.responseBody, rows[0]);
  } finally {
    db.query = originalQuery;
  }
});

test("returns 404 when the row does not exist", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  try {
    const middleware = readId("products", "Product");

    const req = {
      params: {
        id: 999,
      },
    };

    const res = new ResponseBuilder();

    await asMockHandler(middleware)(req, res, () => {});

    assert.equal(res.statusCode, 404);
    assert.equal(res.responseBody, "Product not found");
  } finally {
    db.query = originalQuery;
  }
});

test("passes the request ID to the default query", async () => {
  const originalQuery = db.query;

  let receivedQuery: any;
  let receivedValues: any;

  db.query = async (query: string, values: unknown[]) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [{ id: 25 }],
    };
  };

  try {
    const middleware = readId("products", "Product");

    await asMockHandler(middleware)(
      {
        params: {
          id: 25,
        },
      },
      new ResponseBuilder(),
      () => {},
    );

    assert.match(receivedQuery, /FROM products/);
    assert.match(receivedQuery, /WHERE id = \$1/);
    assert.deepEqual(receivedValues, [25]);
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
    const middleware = readId("products", "Product", "product_id");

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

test("supports a custom query builder", async () => {
  const originalQuery = db.query;

  let builderReceivedReq: any;
  let receivedQuery: any;
  let receivedValues: any;

  const req = {
    params: {
      id: 7,
    },
  };

  const buildQuery = (request: { params: Record<string, unknown> }) => {
    builderReceivedReq = request;

    return {
      query: "SELECT * FROM products WHERE category_id = $1",
      values: [request.params.id],
    };
  };

  db.query = async (query: string, values: unknown[]) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [{ id: 7 }],
    };
  };

  try {
    const middleware = readId("products", "Product", "id", buildQuery);

    await asMockHandler(middleware)(req, new ResponseBuilder(), () => {});

    assert.equal(builderReceivedReq, req);
    assert.equal(
      receivedQuery,
      "SELECT * FROM products WHERE category_id = $1",
    );
    assert.deepEqual(receivedValues, [7]);
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
    const middleware = readId("products", "Product");

    await asMockHandler(middleware)({ params: { id: 1 } }, new ResponseBuilder(), (err: unknown) => {
      receivedError = err;
    });

    assert.equal(receivedError, error);
  } finally {
    db.query = originalQuery;
  }
});
