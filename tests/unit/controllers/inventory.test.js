const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const controller = require("../../../controllers/inventory.js");

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

test("exports all inventory controller functions", () => {
  for (const name of [
    "read",
    "readOne",
    "create",
    "update",
    "remove",
    "productInventory",
    "warehouseInventory",
    "adjustStock",
    "lowStock",
    "inventorySummary",
    "inventorySummaryOne",
    "checkAvailability",
  ]) {
    assert.equal(typeof controller[name], "function");
  }
});

test("create inserts inventory and returns 201", async () => {
  const originalQuery = pg.query;

  const inventory = {
    id: 1,
    product_id: 10,
    warehouse_id: 20,
    amount: 50,
  };

  let parameters;

  pg.query = async (query, values) => {
    parameters = values;

    return {
      rows: [inventory],
    };
  };

  const result = response();

  try {
    await controller.create(
      {
        body: {
          pid: 10,
          wid: 20,
          amo: 50,
        },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, [10, 20, 50]);
    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, inventory);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns 200 when inventory exists", async () => {
  const originalQuery = pg.query;

  const inventory = {
    id: 1,
    product_id: 10,
    warehouse_id: 20,
    amount: 75,
  };

  pg.query = async () => ({
    rows: [inventory],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 1 },
        body: {
          pid: 10,
          wid: 20,
          amo: 75,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, inventory);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns 404 when inventory does not exist", async () => {
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
          wid: 20,
          amo: 10,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Inventory not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("adjustStock increases stock and records a RECEIPT movement", async () => {
  const originalConnect = pg.connect;

  const queries = [];

  const updatedInventory = {
    id: 1,
    product_id: 10,
    warehouse_id: 20,
    amount: 70,
  };

  const transaction = {
    query: async (query, parameters) => {
      queries.push({ query, parameters });

      if (query.includes("SELECT *") && query.includes("FOR UPDATE")) {
        return {
          rows: [
            {
              id: 1,
              product_id: 10,
              warehouse_id: 20,
              amount: 50,
            },
          ],
        };
      }

      if (query.includes("UPDATE inventory")) {
        return {
          rows: [updatedInventory],
        };
      }

      return {
        rows: [],
      };
    },

    release() {
      queries.push({ released: true });
    },
  };

  pg.connect = async () => transaction;

  const result = response();

  try {
    await controller.adjustStock(
      {
        params: { id: 1 },
        body: { change: 20 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, updatedInventory);

    assert.equal(
      queries.some((q) => q.query === "BEGIN"),
      true,
    );

    assert.equal(
      queries.some((q) => q.query === "COMMIT"),
      true,
    );

    const movement = queries.find((q) =>
      q.query.includes("INSERT INTO stock_movements"),
    );

    assert.deepEqual(movement.parameters, [10, 20, "RECEIPT", 20]);

    assert.equal(
      queries.some((q) => q.released === true),
      true,
    );
  } finally {
    pg.connect = originalConnect;
  }
});

test("adjustStock decreases stock and records a SALE movement", async () => {
  const originalConnect = pg.connect;

  const queries = [];

  const transaction = {
    query: async (query, parameters) => {
      queries.push({ query, parameters });

      if (query.includes("SELECT *") && query.includes("FOR UPDATE")) {
        return {
          rows: [
            {
              id: 1,
              product_id: 10,
              warehouse_id: 20,
              amount: 50,
            },
          ],
        };
      }

      if (query.includes("UPDATE inventory")) {
        return {
          rows: [
            {
              id: 1,
              product_id: 10,
              warehouse_id: 20,
              amount: 30,
            },
          ],
        };
      }

      return { rows: [] };
    },

    release() {},
  };

  pg.connect = async () => transaction;

  const result = response();

  try {
    await controller.adjustStock(
      {
        params: { id: 1 },
        body: { change: -20 },
      },
      result.res,
      () => {},
    );

    const movement = queries.find((q) =>
      q.query.includes("INSERT INTO stock_movements"),
    );

    assert.deepEqual(movement.parameters, [10, 20, "SALE", 20]);
  } finally {
    pg.connect = originalConnect;
  }
});

test("adjustStock returns 404 when inventory does not exist", async () => {
  const originalConnect = pg.connect;

  const queries = [];

  const transaction = {
    query: async (query) => {
      queries.push(query);

      if (query.includes("SELECT *") && query.includes("FOR UPDATE")) {
        return {
          rows: [],
        };
      }

      return {
        rows: [],
      };
    },

    release() {},
  };

  pg.connect = async () => transaction;

  const result = response();

  try {
    await controller.adjustStock(
      {
        params: { id: 999 },
        body: { change: 10 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Inventory not found",
    });

    assert.equal(queries.includes("ROLLBACK"), true);
  } finally {
    pg.connect = originalConnect;
  }
});

test("adjustStock prevents stock from becoming negative", async () => {
  const originalConnect = pg.connect;

  const queries = [];

  const transaction = {
    query: async (query) => {
      queries.push(query);

      if (query.includes("SELECT *") && query.includes("FOR UPDATE")) {
        return {
          rows: [
            {
              id: 1,
              product_id: 10,
              warehouse_id: 20,
              amount: 5,
            },
          ],
        };
      }

      return {
        rows: [],
      };
    },

    release() {},
  };

  pg.connect = async () => transaction;

  const result = response();

  try {
    await controller.adjustStock(
      {
        params: { id: 1 },
        body: { change: -10 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 400);
    assert.deepEqual(result.body, {
      message: "Not enough stock",
    });

    assert.equal(queries.includes("ROLLBACK"), true);
  } finally {
    pg.connect = originalConnect;
  }
});

test("lowStock converts the below parameter to a number", async () => {
  const originalQuery = pg.query;

  let parameters;

  pg.query = async (query, values) => {
    parameters = values;

    return {
      rows: [
        {
          product_id: 1,
          total_amount: "5",
        },
      ],
    };
  };

  const result = response();

  try {
    await controller.lowStock(
      {
        params: { below: "10" },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, [10]);
    assert.equal(result.statusCode, 200);
  } finally {
    pg.query = originalQuery;
  }
});

test("lowStock returns 404 when no products are below the limit", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.lowStock(
      {
        params: { below: "10" },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Nothing is below that limit",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("inventorySummary returns inventory totals", async () => {
  const originalQuery = pg.query;

  const rows = [
    {
      product_id: 1,
      total: "50",
    },
  ];

  pg.query = async () => ({
    rows,
  });

  const result = response();

  try {
    await controller.inventorySummary({}, result.res, () => {});

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, rows);
  } finally {
    pg.query = originalQuery;
  }
});

test("inventorySummary returns 404 when inventory is empty", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.inventorySummary({}, result.res, () => {});

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "The inventory is empty",
    });
  } finally {
    pg.query = originalQuery;
  }
});

test("inventorySummaryOne converts product ID to a number", async () => {
  const originalQuery = pg.query;

  let parameters;

  pg.query = async (query, values) => {
    parameters = values;

    return {
      rows: [{ product_id: 5, total: "100" }],
    };
  };

  const result = response();

  try {
    await controller.inventorySummaryOne(
      {
        params: { id: "5" },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, [5]);
    assert.equal(result.statusCode, 200);
  } finally {
    pg.query = originalQuery;
  }
});

test("checkAvailability returns availability information", async () => {
  const originalQuery = pg.query;

  const rows = [
    {
      product_id: 1,
      warehouse_id: 2,
      amount: 50,
      available: "Available",
    },
  ];

  pg.query = async () => ({
    rows,
  });

  const result = response();

  try {
    await controller.checkAvailability(
      {
        body: {
          amount: 20,
          pid: 1,
          wid: 2,
        },
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

test("checkAvailability returns 404 when inventory does not exist", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.checkAvailability(
      {
        body: {
          amount: 20,
          pid: 1,
          wid: 2,
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, {
      message: "Inventory not found",
    });
  } finally {
    pg.query = originalQuery;
  }
});
//
