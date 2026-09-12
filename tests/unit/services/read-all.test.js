const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const readAll = require("../../../services/read-all.js");

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

test("returns all rows with status 200", async () => {
  const originalQuery = pg.query;

  const rows = [
    { id: 1, name: "Product 1" },
    { id: 2, name: "Product 2" },
  ];

  pg.query = async () => ({
    rows,
  });

  try {
    const middleware = readAll("products");

    const req = {};
    const res = new ResponseBuilder();

    await middleware(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.responseBody, rows);
  } finally {
    pg.query = originalQuery;
  }
});

test("returns an empty array when no rows exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  try {
    const middleware = readAll("products");

    const res = new ResponseBuilder();

    await middleware({}, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.responseBody, []);
  } finally {
    pg.query = originalQuery;
  }
});

test("uses the default SELECT query", async () => {
  const originalQuery = pg.query;

  let receivedQuery;
  let receivedValues;

  pg.query = async (query, values) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [],
    };
  };

  try {
    const middleware = readAll("products");

    await middleware({}, new ResponseBuilder(), () => {});

    assert.equal(receivedQuery, "SELECT * FROM products");

    assert.deepEqual(receivedValues, []);
  } finally {
    pg.query = originalQuery;
  }
});

test("uses a custom query builder", async () => {
  const originalQuery = pg.query;

  let builderReceivedReq;
  let receivedQuery;
  let receivedValues;

  const req = {
    params: {
      categoryId: 10,
    },
  };

  const build = (request) => {
    builderReceivedReq = request;

    return {
      query: "SELECT * FROM products WHERE category_id = $1",
      values: [request.params.categoryId],
    };
  };

  pg.query = async (query, values) => {
    receivedQuery = query;
    receivedValues = values;

    return {
      rows: [{ id: 1 }],
    };
  };

  try {
    const middleware = readAll("products", build);

    await middleware(req, new ResponseBuilder(), () => {});

    assert.equal(builderReceivedReq, req);

    assert.equal(
      receivedQuery,
      "SELECT * FROM products WHERE category_id = $1",
    );

    assert.deepEqual(receivedValues, [10]);
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
    const middleware = readAll("products");

    await middleware({}, new ResponseBuilder(), (err) => {
      receivedError = err;
    });

    assert.equal(receivedError, error);
  } finally {
    pg.query = originalQuery;
  }
});
