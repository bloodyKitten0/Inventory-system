const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const controller = require("../../../controllers/products.js");

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

test("exports all product controller functions", () => {
  for (const name of ["read", "readOne", "create", "update", "remove"]) {
    assert.equal(typeof controller[name], "function");
  }
});

test("create inserts product and returns 201", async () => {
  const originalQuery = pg.query;

  const product = {
    id: 1,
    name: "Laptop",
    category_id: 2,
    description: "Computer",
    price: 1000,
  };

  let parameters;

  pg.query = async (query, values) => {
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
    pg.query = originalQuery;
  }
});

test("update updates an existing product and returns 200", async () => {
  const originalQuery = pg.query;

  const product = {
    id: 1,
    name: "Updated Laptop",
    category_id: 3,
    description: "Updated Computer",
    price: 1500,
  };

  let parameters;

  pg.query = async (query, values) => {
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
    pg.query = originalQuery;
  }
});

test("update returns 404 when product does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
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
    pg.query = originalQuery;
  }
});

test("remove deletes a product", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
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
    pg.query = originalQuery;
  }
});
