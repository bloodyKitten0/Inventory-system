import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import * as controllerModule from "../../../controllers/suppliers.js";

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

test("exports all supplier controller functions", () => {
  for (const name of ["read", "readOne", "create", "update", "remove"]) {
    assert.equal(typeof (controllerModule as Record<string, unknown>)[name], "function");
  }
});

test("create inserts supplier and trims strings", async () => {
  const originalQuery = db.query;

  let parameters: unknown;

  const supplier = {
    id: 1,
    supplier_name: "ACME",
  };

  db.query = async (query: string, values: unknown[]) => {
    parameters = values;

    return {
      rows: [supplier],
    };
  };

  const result = response();

  try {
    await controller.create(
      {
        body: {
          supplier_name: " ACME ",
          supplier_email: " acme@example.com ",
          supplier_phone: " 123456 ",
        },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, ["ACME", "acme@example.com", "123456"]);

    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, supplier);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 200 when supplier exists", async () => {
  const originalQuery = db.query;

  const supplier = {
    id: 1,
    supplier_name: "Updated",
  };

  db.query = async () => ({
    rows: [supplier],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 1 },
        body: {
          supplier_name: "Updated",
          supplier_email: "updated@example.com",
          supplier_phone: "12345",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, supplier);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 404 when supplier does not exist", async () => {
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
          supplier_name: "Missing",
          supplier_email: "missing@example.com",
          supplier_phone: "12345",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body, "Supplier not found");
  } finally {
    db.query = originalQuery;
  }
});
