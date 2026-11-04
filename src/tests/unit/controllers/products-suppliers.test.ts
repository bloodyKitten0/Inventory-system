import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import * as controllerModule from "../../../controllers/products-suppliers.js";

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

test("exports all product-supplier controller functions", () => {
  for (const name of [
    "read",
    "readOne",
    "create",
    "update",
    "remove",
    "productsSupplier",
    "supplierProducts",
  ]) {
    assert.equal(typeof (controllerModule as Record<string, unknown>)[name], "function");
  }
});

test("create inserts a product-supplier relation", async () => {
  const originalQuery = db.query;

  const relation = {
    id: 1,
    product_id: 10,
    supplier_id: 20,
  };

  let parameters: unknown;

  db.query = async (query: string, values: unknown[]) => {
    parameters = values;

    return {
      rows: [relation],
    };
  };

  const result = response();

  try {
    await controller.create(
      {
        body: {
          product_id: 10,
          supplier_id: 20,
          supplier_price: 15,
          supplier_sku: " SKU-123 ",
        },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, [10, 20, 15, "SKU-123"]);

    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, relation);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 200 when relation exists", async () => {
  const originalQuery = db.query;

  const relation = {
    id: 1,
    product_id: 10,
    supplier_id: 20,
  };

  db.query = async () => ({
    rows: [relation],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 1 },
        body: {
          product_id: 10,
          supplier_id: 20,
          supplier_price: 15,
          supplier_sku: "SKU",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, relation);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 404 when relation does not exist", async () => {
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
          product_id: 10,
          supplier_id: 20,
          supplier_price: 15,
          supplier_sku: "SKU",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body, "relation not found");
  } finally {
    db.query = originalQuery;
  }
});
