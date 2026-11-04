import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import * as controllerModule from "../../../controllers/products.js";

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

test("exports all product controller functions", () => {
  for (const name of ["read", "readOne", "create", "update", "remove"]) {
    assert.equal(typeof (controllerModule as Record<string, unknown>)[name], "function");
  }
});

test("create inserts product and returns 201", async () => {
  const originalQuery = db.query;

  const product = {
    id: 1,
    name: "Laptop",
    category_id: 2,
    description: "Computer",
    price: 1000,
  };

  let parameters: unknown;

  db.query = async (query: string, values: unknown[]) => {
    parameters = values;

    return {
      rows: [product],
    };
  };

  const result = response();

  try {
    await controller.create(
      {
        body: {
          name: " Laptop ",
          category_id: 2,
          description: " Computer ",
          price: 1000,
        },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, ["Laptop", 2, "Computer", 1000]);

    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, product);
  } finally {
    db.query = originalQuery;
  }
});

test("update updates an existing product and returns 200", async () => {
  const originalQuery = db.query;

  const product = {
    id: 1,
    name: "Updated Laptop",
    category_id: 3,
    description: "Updated Computer",
    price: 1500,
  };

  let parameters: unknown;

  db.query = async (query: string, values: unknown[]) => {
    parameters = values;

    return {
      rows: [product],
    };
  };

  const result = response();

  try {
    await controller.update(
      {
        params: {
          id: 1,
        },

        body: {
          name: " Updated Laptop ",
          category_id: 3,
          description: " Updated Computer ",
          price: 1500,
        },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, [
      1,
      "Updated Laptop",
      3,
      "Updated Computer",
      1500,
    ]);

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, product);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 404 when product does not exist", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: {
          id: 999,
        },

        body: {
          name: "Laptop",
          category_id: 2,
          description: "Computer",
          price: 1000,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body, "Product not found");
  } finally {
    db.query = originalQuery;
  }
});

test("remove deletes a product", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [
      {
        id: 1,
      },
    ],
  });

  const result = response();

  try {
    await controller.remove(
      {
        params: {
          id: 1,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.equal(result.body, "Products deleted");
  } finally {
    db.query = originalQuery;
  }
});
