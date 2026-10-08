import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import * as controllerModule from "../../../controllers/customers.js";

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

test("exports all customer controller functions", () => {
  for (const name of ["read", "readOne", "create", "update", "remove"]) {
    assert.equal(typeof (controllerModule as Record<string, unknown>)[name], "function");
  }
});

test("create inserts customer and returns 201", async () => {
  const originalQuery = db.query;

  const customer = {
    customer_id: 1,
    customer_name: "John",
  };

  let parameters: unknown;

  db.query = async (query: string, values: unknown[]) => {
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
    db.query = originalQuery;
  }
});

test("update returns customer when found", async () => {
  const originalQuery = db.query;

  const customer = {
    customer_id: 10,
    customer_email: "new@example.com",
  };

  db.query = async () => ({
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
    db.query = originalQuery;
  }
});

test("update returns 404 when customer does not exist", async () => {
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
    db.query = originalQuery;
  }
});

test("create forwards database errors", async () => {
  const originalQuery = db.query;
  const error = new Error("Database error");

  db.query = async () => {
    throw error;
  };

  const result = response();
  let receivedError: unknown;

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
      (err: unknown) => {
        receivedError = err;
      },
    );

    assert.equal(receivedError, error);
  } finally {
    db.query = originalQuery;
  }
});

test("update filters on the customer id column", async () => {
  const originalQuery = db.query;

  let receivedQuery = "";

  db.query = async (query: string) => {
    receivedQuery = query;

    return { rows: [{ id: 10 }] };
  };

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

    assert.match(receivedQuery, /WHERE id = \$1/);
    assert.doesNotMatch(receivedQuery, /customer_id/);
  } finally {
    db.query = originalQuery;
  }
});
