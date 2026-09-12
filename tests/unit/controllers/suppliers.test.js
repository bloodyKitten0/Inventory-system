const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const controller = require("../../../controllers/suppliers.js");

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

test("exports all supplier controller functions", () => {
  for (const name of ["read", "readOne", "create", "update", "remove"]) {
    assert.equal(typeof controller[name], "function");
  }
});

test("create inserts supplier and trims strings", async () => {
  const originalQuery = pg.query;

  let parameters;

  const supplier = {
    id: 1,
    supplier_name: "ACME",
  };

  pg.query = async (query, values) => {
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
    pg.query = originalQuery;
  }
});

test("update returns 200 when supplier exists", async () => {
  const originalQuery = pg.query;

  const supplier = {
    id: 1,
    supplier_name: "Updated",
  };

  pg.query = async () => ({
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
    pg.query = originalQuery;
  }
});

test("update returns 404 when supplier does not exist", async () => {
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
    pg.query = originalQuery;
  }
});
