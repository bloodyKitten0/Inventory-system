const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const readId = require("../../../services/read-id.js");

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

test("returns the first row with status 200", async () => {
  const originalQuery = pg.query;

  const rows = [
    { id: 10, name: "Product 10" },
    { id: 11, name: "Product 11" },
  ];

  pg.query = async () => ({
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

    await middleware(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.responseBody, rows[0]);
  } finally {
    pg.query = originalQuery;
  }
});

test("returns 404 when the row does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
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

    await middleware(req, res, () => {});

    assert.equal(res.statusCode, 404);
    assert.equal(res.responseBody, "Product not found");
  } finally {
    pg.query = originalQuery;
  }
});

test("passes the request ID to the default query", async () => {
  const originalQuery = pg.query;

  let receivedQuery;
  let receivedValues;

  pg.query = async (query, values) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [{ id: 25 }],
    };
  };

  try {
    const middleware = readId("products", "Product");

    await middleware(
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
    const middleware = readId("products", "Product", "product_id");

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

test("supports a custom query builder", async () => {
  const originalQuery = pg.query;

  let builderReceivedReq;
  let receivedQuery;
  let receivedValues;

  const req = {
    params: {
      id: 7,
    },
  };

  const buildQuery = (request) => {
    builderReceivedReq = request;

    return {
      query: "SELECT * FROM products WHERE category_id = $1",
      values: [request.params.id],
    };
  };

  pg.query = async (query, values) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [{ id: 7 }],
    };
  };

  try {
    const middleware = readId("products", "Product", "id", buildQuery);

    await middleware(req, new ResponseBuilder(), () => {});

    assert.equal(builderReceivedReq, req);
    assert.equal(
      receivedQuery,
      "SELECT * FROM products WHERE category_id = $1",
    );
    assert.deepEqual(receivedValues, [7]);
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
    const middleware = readId("products", "Product");

    await middleware({ params: { id: 1 } }, new ResponseBuilder(), (err) => {
      receivedError = err;
    });

    assert.equal(receivedError, error);
  } finally {
    pg.query = originalQuery;
  }
});
