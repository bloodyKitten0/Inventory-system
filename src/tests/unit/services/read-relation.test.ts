import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import { one, two } from "../../../services/read-relation.js";
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

test("one returns relation rows with status 200", async () => {
  const originalQuery = db.query;

  const rows = [
    {
      product_id: 1,
      supplier_id: 10,
    },
  ];

  db.query = async () => ({
    rows,
  });

  try {
    const middleware = one(
      "products",
      "products_suppliers",
      "product_id",
      "product_id",
      "product_id",
    );

    const req = {
      params: {
        id: 1,
      },
    };

    const res = new ResponseBuilder();

    await asMockHandler(middleware)(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.responseBody, rows);
  } finally {
    db.query = originalQuery;
  }
});

test("one returns 404 when no relation rows exist", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  try {
    const middleware = one(
      "products",
      "products_suppliers",
      "product_id",
      "product_id",
      "product_id",
    );

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
    assert.equal(res.responseBody, "relation not found");
  } finally {
    db.query = originalQuery;
  }
});

test("one uses the request ID as the query parameter", async () => {
  const originalQuery = db.query;

  let receivedQuery: any;
  let receivedValues: any;

  db.query = async (query: string, values: unknown[]) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [{ id: 5 }],
    };
  };

  try {
    const middleware = one(
      "products",
      "suppliers",
      "product_id",
      "product_id",
      "product_id",
    );

    await asMockHandler(middleware)(
      {
        params: {
          id: 5,
        },
      },
      new ResponseBuilder(),
      () => {},
    );

    assert.match(receivedQuery, /SELECT \* FROM products s/);
    assert.match(receivedQuery, /JOIN suppliers j/);
    assert.deepEqual(receivedValues, [5]);
  } finally {
    db.query = originalQuery;
  }
});

test("two returns relation rows with status 200", async () => {
  const originalQuery = db.query;

  const rows = [
    {
      product_id: 1,
      supplier_id: 10,
      category_id: 2,
    },
  ];

  db.query = async () => ({
    rows,
  });

  try {
    const middleware = two(
      "products",
      "products_suppliers",
      "product_id",
      "product_id",
      "suppliers",
      "supplier_id",
      "supplier_id",
      "product_id",
    );

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
    assert.deepEqual(res.responseBody, rows);
  } finally {
    db.query = originalQuery;
  }
});

test("two returns 404 when no rows exist", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  try {
    const middleware = two(
      "products",
      "products_suppliers",
      "product_id",
      "product_id",
      "suppliers",
      "supplier_id",
      "supplier_id",
      "product_id",
    );

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
    assert.equal(res.responseBody, "No rows have been found");
  } finally {
    db.query = originalQuery;
  }
});

test("two uses the request ID as the query parameter", async () => {
  const originalQuery = db.query;

  let receivedValues: any;

  db.query = async (query: string, values: unknown[]) => {
    receivedValues = values;

    return {
      rows: [{ id: 1 }],
    };
  };

  try {
    const middleware = two(
      "products",
      "suppliers",
      "product_id",
      "product_id",
      "categories",
      "category_id",
      "category_id",
      "product_id",
    );

    await asMockHandler(middleware)(
      {
        params: {
          id: 42,
        },
      },
      new ResponseBuilder(),
      () => {},
    );

    assert.deepEqual(receivedValues, [42]);
  } finally {
    db.query = originalQuery;
  }
});

test("one passes database errors to next", async () => {
  const originalQuery = db.query;

  const error = new Error("Database failure");

  db.query = async () => {
    throw error;
  };

  let receivedError: any;

  try {
    const middleware = one(
      "products",
      "suppliers",
      "product_id",
      "product_id",
      "product_id",
    );

    await asMockHandler(middleware)({ params: { id: 1 } }, new ResponseBuilder(), (err: unknown) => {
      receivedError = err;
    });

    assert.equal(receivedError, error);
  } finally {
    db.query = originalQuery;
  }
});

test("two passes database errors to next", async () => {
  const originalQuery = db.query;

  const error = new Error("Database failure");

  db.query = async () => {
    throw error;
  };

  let receivedError: any;

  try {
    const middleware = two(
      "products",
      "suppliers",
      "product_id",
      "product_id",
      "categories",
      "category_id",
      "category_id",
      "product_id",
    );

    await asMockHandler(middleware)({ params: { id: 1 } }, new ResponseBuilder(), (err: unknown) => {
      receivedError = err;
    });

    assert.equal(receivedError, error);
  } finally {
    db.query = originalQuery;
  }
});
