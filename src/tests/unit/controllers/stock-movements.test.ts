import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import * as controllerModule from "../../../controllers/stock-movements.js";

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

test("exports all stock-movement controller functions", () => {
  for (const name of [
    "read",
    "readOne",
    "productMovements",
    "warehouseMovements",
    "productWarehouseMovements",
  ]) {
    assert.equal(typeof (controllerModule as Record<string, unknown>)[name], "function");
  }
});

test("read returns all stock movements", async () => {
  const originalQuery = db.query;

  const rows = [
    {
      id: 1,
      product_id: 10,
      movement_type: "SALE",
    },
  ];

  db.query = async () => ({
    rows,
  });

  const result = response();

  try {
    await controller.read({}, result.res, () => {});

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, rows);
  } finally {
    db.query = originalQuery;
  }
});

test("readOne returns a stock movement", async () => {
  const originalQuery = db.query;

  const row = {
    id: 1,
    product_id: 10,
    movement_type: "SALE",
  };

  db.query = async () => ({
    rows: [row],
  });

  const result = response();

  try {
    await controller.readOne(
      {
        params: { id: 1 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, row);
  } finally {
    db.query = originalQuery;
  }
});

test("readOne returns 404 when movement does not exist", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.readOne(
      {
        params: { id: 999 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body, "stock movement not found");
  } finally {
    db.query = originalQuery;
  }
});

test("productMovements returns movements for a product", async () => {
  const originalQuery = db.query;

  const rows = [
    {
      product_id: 10,
      movement_type: "SALE",
    },
  ];

  db.query = async () => ({
    rows,
  });

  const result = response();

  try {
    await controller.productMovements(
      {
        params: { id: 10 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, rows);
  } finally {
    db.query = originalQuery;
  }
});

test("warehouseMovements returns movements for a warehouse", async () => {
  const originalQuery = db.query;

  const rows = [
    {
      warehouse_id: 5,
      movement_type: "RECEIPT",
    },
  ];

  db.query = async () => ({
    rows,
  });

  const result = response();

  try {
    await controller.warehouseMovements(
      {
        params: { id: 5 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, rows);
  } finally {
    db.query = originalQuery;
  }
});

test("productWarehouseMovements returns joined movements", async () => {
  const originalQuery = db.query;

  const rows = [
    {
      product_id: 10,
      warehouse_id: 5,
      movement_type: "SALE",
    },
  ];

  db.query = async () => ({
    rows,
  });

  const result = response();

  try {
    await controller.productWarehouseMovements(
      {
        params: { id: 10 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, rows);
  } finally {
    db.query = originalQuery;
  }
});
