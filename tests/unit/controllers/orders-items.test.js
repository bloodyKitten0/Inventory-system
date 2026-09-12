const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const controller = require("../../../controllers/orders-items.js");

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

test("exports all order-item controller functions", () => {
  for (const name of [
    "read",
    "readOne",
    "create",
    "update",
    "remove",
    "orderItems",
    "productOrderItems",
    "orderItemDetails",
  ]) {
    assert.equal(typeof controller[name], "function");
  }
});

test("create inserts an order item and returns 201", async () => {
  const originalQuery = pg.query;

  const item = {
    id: 1,
    order_id: 10,
    product_id: 20,
    quantity: 3,
    price: 15,
  };

  let parameters;

  pg.query = async (query, values) => {
    parameters = values;

    return {
      rows: [item],
    };
  };

  const result = response();

  try {
    await controller.create(
      {
        body: {
          oid: 10,
          pid: 20,
          quan: 3,
          price: 15,
        },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, [10, 20, 3, 15]);
    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, item);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns 200 when item exists", async () => {
  const originalQuery = pg.query;

  const item = {
    id: 1,
    quantity: 5,
    price: 20,
  };

  pg.query = async () => ({
    rows: [item],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 1 },
        body: {
          oid: 10,
          pid: 20,
          quan: 5,
          price: 20,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, item);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns 404 when item does not exist", async () => {
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
          oid: 10,
          pid: 20,
          quan: 5,
          price: 20,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Item not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});
//
