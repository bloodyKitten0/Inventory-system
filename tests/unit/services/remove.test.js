const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const remove = require("../../../services/remove.js");

class ResponseBuilder {
  #statusCode;
  #responseBody;

  status(code) {
    this.#statusCode = code;
    return this;
  }

  json(body) {
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
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [{ id: 1 }],
  });

  try {
    const middleware = remove("products", "Product");

    const res = new ResponseBuilder();

    await middleware(
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
    pg.query = originalQuery;
  }
});

test("returns 404 when no row is deleted", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  try {
    const middleware = remove("products", "Product");

    const res = new ResponseBuilder();

    await middleware(
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
    pg.query = originalQuery;
  }
});

test("passes the request ID to the delete query", async () => {
  const originalQuery = pg.query;

  let receivedQuery;
  let receivedValues;

  pg.query = async (query, values) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [{ id: 42 }],
    };
  };

  try {
    const middleware = remove("products", "Product");

    await middleware(
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
    pg.query = originalQuery;
  }
});

test("supports a custom ID column", async () => {
  const originalQuery = pg.query;

  let receivedQuery;
  let receivedValues;

  pg.query = async (query, values) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [{ product_id: 42 }],
    };
  };

  try {
    const middleware = remove("products", "Product", "product_id");

    await middleware(
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
    pg.query = originalQuery;
  }
});

test("passes database errors to next", async () => {
  const originalQuery = pg.query;

  const error = new Error("Database failure");

  pg.query = async () => {
    throw error;
  };

  let receivedError;

  try {
    const middleware = remove("products", "Product");

    await middleware({ params: { id: 1 } }, new ResponseBuilder(), (err) => {
      receivedError = err;
    });

    assert.equal(receivedError, error);
  } finally {
    pg.query = originalQuery;
  }
});
