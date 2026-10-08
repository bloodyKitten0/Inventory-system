const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const controller = require("../../../controllers/warehouses.js");

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

test("exports all warehouse controller functions", () => {
  for (const name of ["read", "readOne", "create", "update", "remove"]) {
    assert.equal(typeof controller[name], "function");
  }
});

test("create inserts warehouse and returns 201", async () => {
  const originalQuery = pg.query;

  const warehouse = {
    id: 1,
    name: "Main Warehouse",
    location: "Riyadh",
  };

  let parameters;

  pg.query = async (query, values) => {
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
    pg.query = originalQuery;
  }
});

test("update returns 200 when warehouse exists", async () => {
  const originalQuery = pg.query;

  const warehouse = {
    id: 1,
    name: "Updated Warehouse",
    location: "Jeddah",
  };

  pg.query = async () => ({
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
    pg.query = originalQuery;
  }
});

test("update returns 404 when warehouse does not exist", async () => {
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
    pg.query = originalQuery;
  }
});
