import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import * as controllerModule from "../../../controllers/orders-items.js";

const db = pg as unknown as { query: unknown; connect: unknown };

type Handler = (req: unknown, res: unknown, next: unknown) => Promise<void>;

const controller = controllerModule as unknown as Record<
  keyof typeof controllerModule,
  Handler
>;

const response = () => {
  let statusCode: unknown;
  let body: unknown;

  return {
    res: {
      status(code: number) {
        statusCode = code;
        return this;
      },

      json(value: unknown) {
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
    assert.equal(typeof (controllerModule as Record<string, unknown>)[name], "function");
  }
});

test("create inserts an order item and returns 201", async () => {
  const originalQuery = db.query;

  const item = {
    id: 1,
    order_id: 10,
    product_id: 20,
    quantity: 3,
    price: 15,
  };

  let parameters: unknown;

  db.query = async (query: string, values: unknown[]) => {
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
          order_id: 10,
          product_id: 20,
          quantity: 3,
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
    db.query = originalQuery;
  }
});

test("update returns 200 when item exists", async () => {
  const originalQuery = db.query;

  const item = {
    id: 1,
    quantity: 5,
    price: 20,
  };

  db.query = async () => ({
    rows: [item],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 1 },
        body: {
          order_id: 10,
          product_id: 20,
          quantity: 5,
          price: 20,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, item);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 404 when item does not exist", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 999 },
        body: {
          order_id: 10,
          product_id: 20,
          quantity: 5,
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
    db.query = originalQuery;
  }
});
