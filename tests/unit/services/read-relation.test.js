const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const { one, two } = require("../../../services/read-relation.js");

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

test("one returns relation rows with status 200", async () => {
  const originalQuery = pg.query;

  const rows = [
    {
      product_id: 1,
      supplier_id: 10,
    },
  ];

  pg.query = async () => ({
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

    await middleware(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.responseBody, rows);
  } finally {
    pg.query = originalQuery;
  }
});

test("one returns 404 when no relation rows exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
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
    assert.equal(res.responseBody, "relation not found");
  } finally {
    pg.query = originalQuery;
  }
});

test("one uses the request ID as the query parameter", async () => {
  const originalQuery = pg.query;

  let receivedQuery;
  let receivedValues;

  pg.query = async (query, values) => {
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

    await middleware(
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
    pg.query = originalQuery;
  }
});

test("two returns relation rows with status 200", async () => {
  const originalQuery = pg.query;

  const rows = [
    {
      product_id: 1,
      supplier_id: 10,
      category_id: 2,
    },
  ];

  pg.query = async () => ({
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
    assert.deepEqual(res.responseBody, rows);
  } finally {
    pg.query = originalQuery;
  }
});

test("two returns 404 when no rows exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
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
    assert.equal(res.responseBody, "No rows have been found");
  } finally {
    pg.query = originalQuery;
  }
});

test("two uses the request ID as the query parameter", async () => {
  const originalQuery = pg.query;

  let receivedValues;

  pg.query = async (query, values) => {
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

    await middleware(
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
    pg.query = originalQuery;
  }
});

test("one passes database errors to next", async () => {
  const originalQuery = pg.query;

  const error = new Error("Database failure");

  pg.query = async () => {
    throw error;
  };

  let receivedError;

  try {
    const middleware = one(
      "products",
      "suppliers",
      "product_id",
      "product_id",
      "product_id",
    );

    await middleware({ params: { id: 1 } }, new ResponseBuilder(), (err) => {
      receivedError = err;
    });

    assert.equal(receivedError, error);
  } finally {
    pg.query = originalQuery;
  }
});

test("two passes database errors to next", async () => {
  const originalQuery = pg.query;

  const error = new Error("Database failure");

  pg.query = async () => {
    throw error;
  };

  let receivedError;

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

    await middleware({ params: { id: 1 } }, new ResponseBuilder(), (err) => {
      receivedError = err;
    });

    assert.equal(receivedError, error);
  } finally {
    pg.query = originalQuery;
  }
});
//
