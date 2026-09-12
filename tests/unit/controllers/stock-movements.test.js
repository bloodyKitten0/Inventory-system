const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const controller = require("../../../controllers/stock-movements.js");

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

test("exports all stock-movement controller functions", () => {
  for (const name of [
    "read",
    "readOne",
    "productMovements",
    "warehouseMovements",
    "productWarehouseMovements",
  ]) {
    assert.equal(typeof controller[name], "function");
  }
});

test("read returns all stock movements", async () => {
  const originalQuery = pg.query;

  const rows = [
    {
      id: 1,
      product_id: 10,
      movement_type: "SALE",
    },
  ];

  pg.query = async () => ({
    rows,
  });

  const result = response();

  try {
    await controller.read({}, result.res, () => {});

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, rows);
  } finally {
    pg.query = originalQuery;
  }
});

test("readOne returns a stock movement", async () => {
  const originalQuery = pg.query;

  const row = {
    id: 1,
    product_id: 10,
    movement_type: "SALE",
  };

  pg.query = async () => ({
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
    pg.query = originalQuery;
  }
});

test("readOne returns 404 when movement does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
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
    pg.query = originalQuery;
  }
});

test("productMovements returns movements for a product", async () => {
  const originalQuery = pg.query;

  const rows = [
    {
      product_id: 10,
      movement_type: "SALE",
    },
  ];

  pg.query = async () => ({
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
    pg.query = originalQuery;
  }
});

test("warehouseMovements returns movements for a warehouse", async () => {
  const originalQuery = pg.query;

  const rows = [
    {
      warehouse_id: 5,
      movement_type: "RECEIPT",
    },
  ];

  pg.query = async () => ({
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
    pg.query = originalQuery;
  }
});

test("productWarehouseMovements returns joined movements", async () => {
  const originalQuery = pg.query;

  const rows = [
    {
      product_id: 10,
      warehouse_id: 5,
      movement_type: "SALE",
    },
  ];

  pg.query = async () => ({
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
    pg.query = originalQuery;
  }
});
//
