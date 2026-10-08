import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import * as controllerModule from "../../../controllers/warehouses.js";

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

test("exports all warehouse controller functions", () => {
  for (const name of ["read", "readOne", "create", "update", "remove"]) {
    assert.equal(typeof (controllerModule as Record<string, unknown>)[name], "function");
  }
});

test("create inserts warehouse and returns 201", async () => {
  const originalQuery = db.query;

  const warehouse = {
    id: 1,
    name: "Main Warehouse",
    location: "Riyadh",
  };

  let parameters: unknown;

  db.query = async (query: string, values: unknown[]) => {
    parameters = values;

    return {
      rows: [warehouse],
    };
  };

  const result = response();

  try {
    await controller.create(
      {
        body: {
          name: " Main Warehouse ",
          location: " Riyadh ",
        },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, ["Main Warehouse", "Riyadh"]);

    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, warehouse);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 200 when warehouse exists", async () => {
  const originalQuery = db.query;

  const warehouse = {
    id: 1,
    name: "Updated Warehouse",
    location: "Jeddah",
  };

  db.query = async () => ({
    rows: [warehouse],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 1 },
        body: {
          name: "Updated Warehouse",
          location: "Jeddah",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, warehouse);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 404 when warehouse does not exist", async () => {
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
          name: "Missing",
          location: "Unknown",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body, "Warehouse not found");
  } finally {
    db.query = originalQuery;
  }
});
