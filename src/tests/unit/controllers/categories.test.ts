import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import * as controllerModule from "../../../controllers/categories.js";

const db = pg as unknown as { query: unknown; connect: unknown };

type Handler = (req: unknown, res: unknown, next: unknown) => Promise<void>;

const controller = controllerModule as unknown as Record<
  keyof typeof controllerModule,
  Handler
>;

const createResponse = () => {
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

test("exports all category controller functions", () => {
  assert.equal(typeof controller.read, "function");
  assert.equal(typeof controller.readOne, "function");
  assert.equal(typeof controller.create, "function");
  assert.equal(typeof controller.update, "function");
  assert.equal(typeof controller.remove, "function");
});

test("create inserts a category and returns 201", async () => {
  const originalQuery = db.query;

  const category = {
    id: 1,
    name: "Electronics",
    description: "Electronic products",
  };

  let parameters: unknown;

  db.query = async (query: string, values: unknown[]) => {
    parameters = values;

    return {
      rows: [category],
    };
  };

  const response = createResponse();

  try {
    await controller.create(
      {
        body: {
          name: " Electronics ",
          description: " Electronic products ",
        },
      },
      response.res,
      () => {},
    );

    assert.deepEqual(parameters, ["Electronics", "Electronic products"]);

    assert.equal(response.statusCode, 201);
    assert.deepEqual(response.body, category);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 200 when the category exists", async () => {
  const originalQuery = db.query;

  const category = {
    id: 5,
    name: "Updated",
    description: "Updated description",
  };

  db.query = async () => ({
    rows: [category],
  });

  const response = createResponse();

  try {
    await controller.update(
      {
        params: { id: 5 },
        body: {
          name: "Updated",
          description: "Updated description",
        },
      },
      response.res,
      () => {},
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, category);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 404 when category does not exist", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  const response = createResponse();

  try {
    await controller.update(
      {
        params: { id: 999 },
        body: {
          name: "Missing",
          description: "Missing category",
        },
      },
      response.res,
      () => {},
    );

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, {
      message: "Category not found",
    });
  } finally {
    db.query = originalQuery;
  }
});

test("create forwards database errors to next", async () => {
  const originalQuery = db.query;
  const error = new Error("Database failure");

  db.query = async () => {
    throw error;
  };

  const response = createResponse();
  let receivedError: unknown;

  try {
    await controller.create(
      {
        body: {
          name: "Category",
          description: "Description",
        },
      },
      response.res,
      (err: unknown) => {
        receivedError = err;
      },
    );

    assert.equal(receivedError, error);
  } finally {
    db.query = originalQuery;
  }
});
