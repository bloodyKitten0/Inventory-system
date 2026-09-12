const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const controller = require("../../../controllers/products-suppliers.js");

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
    assert.equal(typeof controller[name], "function");
  }
});

test("create inserts a product-supplier relation", async () => {
  const originalQuery = pg.query;

  const relation = {
    id: 1,
    product_id: 10,
    supplier_id: 20,
  };

  let parameters;

  pg.query = async (query, values) => {
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
          pid: 10,
          sid: 20,
          spr: 15,
          sku: " SKU-123 ",
        },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, [10, 20, 15, "SKU-123"]);

    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, relation);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns 200 when relation exists", async () => {
  const originalQuery = pg.query;

  const relation = {
    id: 1,
    product_id: 10,
    supplier_id: 20,
  };

  pg.query = async () => ({
    rows: [relation],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 1 },
        body: {
          pid: 10,
          sid: 20,
          spr: 15,
          sku: "SKU",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, relation);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns 404 when relation does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 999 },
        body: {
          pid: 10,
          sid: 20,
          spr: 15,
          sku: "SKU",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body, "relation not found");
  } finally {
    pg.query = originalQuery;
  }
});
//
