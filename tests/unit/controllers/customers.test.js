const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const controller = require("../../../controllers/customers.js");

const response = () => {
  let statusCode;
  let body;

  return {
    res: {
      status(code) {
        statusCode = code;
        return this;
      },

      json(value) {
        body = value;
        return this;
      },
    },

    get statusCode() {
      return statusCode;
    },

    get body() {
      return body;
    },
  };
};

test("exports all customer controller functions", () => {
  for (const name of ["read", "readOne", "create", "update", "remove"]) {
    assert.equal(typeof controller[name], "function");
  }
});

test("create inserts customer and returns 201", async () => {
  const originalQuery = pg.query;

  const customer = {
    customer_id: 1,
    customer_name: "John",
  };

  let parameters;

  pg.query = async (query, values) => {
    parameters = values;

    return {
      rows: [customer],
    };
  };

  const result = response();

  try {
    await controller.create(
      {
        body: {
          customer_name: " John ",
          customer_email: " john@example.com ",
          shipping_address: " Riyadh ",
        },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, ["John", "john@example.com", "Riyadh"]);

    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, customer);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns customer when found", async () => {
  const originalQuery = pg.query;

  const customer = {
    customer_id: 10,
    customer_email: "new@example.com",
  };

  pg.query = async () => ({
    rows: [customer],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 10 },
        body: {
          customer_email: "new@example.com",
          shipping_address: "New address",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, customer);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns 404 when customer does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 999 },
        body: {
          customer_email: "missing@example.com",
          shipping_address: "Missing",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Customer not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("create forwards database errors", async () => {
  const originalQuery = pg.query;
  const error = new Error("Database error");

  pg.query = async () => {
    throw error;
  };

  const result = response();
  let receivedError;

  try {
    await controller.create(
      {
        body: {
          customer_name: "John",
          customer_email: "john@example.com",
          shipping_address: "Riyadh",
        },
      },
      result.res,
      (err) => {
        receivedError = err;
      },
    );

    assert.equal(receivedError, error);
  } finally {
    pg.query = originalQuery;
  }
});
//
