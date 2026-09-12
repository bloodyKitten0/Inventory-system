const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const controller = require("../../../controllers/categories.js");

const createResponse = () => {
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

test("exports all category controller functions", () => {
  assert.equal(typeof controller.read, "function");
  assert.equal(typeof controller.readOne, "function");
  assert.equal(typeof controller.create, "function");
  assert.equal(typeof controller.update, "function");
  assert.equal(typeof controller.remove, "function");
});

test("create inserts a category and returns 201", async () => {
  const originalQuery = pg.query;

  const category = {
    id: 1,
    name: "Electronics",
    description: "Electronic products",
  };

  let parameters;

  pg.query = async (query, values) => {
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
          desc: " Electronic products ",
        },
      },
      response.res,
      () => {},
    );

    assert.deepEqual(parameters, ["Electronics", "Electronic products"]);

    assert.equal(response.statusCode, 201);
    assert.deepEqual(response.body, category);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns 200 when the category exists", async () => {
  const originalQuery = pg.query;

  const category = {
    id: 5,
    name: "Updated",
    description: "Updated description",
  };

  pg.query = async () => ({
    rows: [category],
  });

  const response = createResponse();

  try {
    await controller.update(
      {
        params: { id: 5 },
        body: {
          name: "Updated",
          desc: "Updated description",
        },
      },
      response.res,
      () => {},
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, category);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns 404 when category does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const response = createResponse();

  try {
    await controller.update(
      {
        params: { id: 999 },
        body: {
          name: "Missing",
          desc: "Missing category",
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
    pg.query = originalQuery;
  }
});

test("create forwards database errors to next", async () => {
  const originalQuery = pg.query;
  const error = new Error("Database failure");

  pg.query = async () => {
    throw error;
  };

  const response = createResponse();
  let receivedError;

  try {
    await controller.create(
      {
        body: {
          name: "Category",
          desc: "Description",
        },
      },
      response.res,
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
