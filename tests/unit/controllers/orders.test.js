const test = require("node:test");
const assert = require("node:assert/strict");

const pg = require("../../../config/db.js");
const controller = require("../../../controllers/orders.js");

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

test("exports all order controller functions", () => {
  for (const name of [
    "read",
    "readOne",
    "create",
    "update",
    "remove",
    "customerOrders",
    "warehouseOrders",
    "updateStatus",
    "cancelOrder",
    "orderDetails",
    "calculateOrderTotal",
    "processOrder",
  ]) {
    assert.equal(typeof controller[name], "function");
  }
});

test("create creates a pending order and returns 201", async () => {
  const originalQuery = pg.query;

  const order = {
    id: 1,
    customer_id: 10,
    warehouse_id: 20,
    status: "pending",
  };

  let parameters;

  pg.query = async (query, values) => {
    parameters = values;

    return {
      rows: [order],
    };
  };

  const result = response();

  try {
    await controller.create(
      {
        body: {
          cid: 10,
          wid: 20,
        },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, [10, 20]);
    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, order);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns 200 when order exists", async () => {
  const originalQuery = pg.query;

  const order = {
    id: 1,
    customer_id: 10,
    warehouse_id: 20,
    status: "processing",
  };

  pg.query = async () => ({
    rows: [order],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 1 },
        body: {
          cid: 10,
          wid: 20,
          status: "processing",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, order);
  } finally {
    pg.query = originalQuery;
  }
});

test("update returns 404 when order does not exist", async () => {
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
          cid: 10,
          wid: 20,
          status: "processing",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body, "order not found");
  } finally {
    pg.query = originalQuery;
  }
});

test("updateStatus updates the order status", async () => {
  const originalQuery = pg.query;

  const order = {
    id: 1,
    status: "completed",
  };

  let parameters;

  pg.query = async (query, values) => {
    parameters = values;

    return {
      rows: [order],
    };
  };

  const result = response();

  try {
    await controller.updateStatus(
      {
        params: { id: 1 },
        body: { status: "completed" },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, ["completed", 1]);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, order);
  } finally {
    pg.query = originalQuery;
  }
});

test("cancelOrder cancels a pending order", async () => {
  const originalQuery = pg.query;

  const order = {
    id: 1,
    status: "cancelled",
  };

  pg.query = async () => ({
    rows: [order],
  });

  const result = response();

  try {
    await controller.cancelOrder(
      {
        params: { id: 1 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, order);
  } finally {
    pg.query = originalQuery;
  }
});

test("cancelOrder returns 404 when order cannot be cancelled", async () => {
  const originalQuery = pg.query;

  pg.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.cancelOrder(
      {
        params: { id: 1 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body, "order not found or can't be canceled");
  } finally {
    pg.query = originalQuery;
  }
});

test("orderDetails returns order details", async () => {
  const originalQuery = pg.query;

  const rows = [
    {
      id: 1,
      product_id: 10,
      quantity: 2,
    },
  ];

  pg.query = async () => ({
    rows,
  });

  const result = response();

  try {
    await controller.orderDetails(
      {
        params: { id: 1 },
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

test("calculateOrderTotal returns calculated total", async () => {
  const originalQuery = pg.query;

  const row = {
    order_id: 1,
    total: "100",
  };

  pg.query = async () => ({
    rows: [row],
  });

  const result = response();

  try {
    await controller.calculateOrderTotal(
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

test("processOrder returns 404 when order does not exist", async () => {
  const originalConnect = pg.connect;

  const queries = [];

  const transaction = {
    query: async (query) => {
      queries.push(query);

      if (
        query.includes("SELECT *") &&
        query.includes("FROM orders") &&
        !query.includes("FROM orders_items")
      ) {
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
    await controller.processOrder(
      {
        params: { id: 999 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body, "Order not found");
    assert.equal(queries.includes("ROLLBACK"), true);
  } finally {
    pg.connect = originalConnect;
  }
});

test("processOrder rejects orders that are not pending", async () => {
  const originalConnect = pg.connect;

  const queries = [];

  const transaction = {
    query: async (query) => {
      queries.push(query);

      if (
        query.includes("SELECT *") &&
        query.includes("FROM orders") &&
        !query.includes("FROM orders_items")
      ) {
        return {
          rows: [
            {
              id: 1,
              status: "completed",
              warehouse_id: 20,
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
    await controller.processOrder(
      {
        params: { id: 1 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 400);

    assert.deepEqual(result.body, {
      error: "Order cannot be processed",
      currentStatus: "completed",
      requiredStatus: "pending",
    });

    assert.equal(queries.includes("ROLLBACK"), true);
  } finally {
    pg.connect = originalConnect;
  }
});

test("processOrder rejects an order with no items", async () => {
  const originalConnect = pg.connect;

  const queries = [];

  const transaction = {
    query: async (query) => {
      queries.push(query);

      if (
        query.includes("SELECT *") &&
        query.includes("FROM orders") &&
        !query.includes("FROM orders_items")
      ) {
        return {
          rows: [
            {
              id: 1,
              status: "pending",
              warehouse_id: 20,
            },
          ],
        };
      }

      if (query.includes("FROM orders_items")) {
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
    await controller.processOrder(
      {
        params: { id: 1 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 400);
    assert.equal(result.body, "Order has no items");
    assert.equal(queries.includes("ROLLBACK"), true);
  } finally {
    pg.connect = originalConnect;
  }
});

test("processOrder rejects an item missing from the warehouse", async () => {
  const originalConnect = pg.connect;

  const queries = [];

  const transaction = {
    query: async (query) => {
      queries.push(query);

      if (
        query.includes("FROM orders") &&
        query.includes("FOR UPDATE") &&
        !query.includes("FROM orders_items")
      ) {
        return {
          rows: [
            {
              id: 1,
              status: "pending",
              warehouse_id: 20,
            },
          ],
        };
      }

      if (query.includes("FROM orders_items")) {
        return {
          rows: [
            {
              product_id: 10,
              quantity: 2,
            },
          ],
        };
      }

      if (query.includes("FROM inventory") && query.includes("FOR UPDATE")) {
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
    await controller.processOrder(
      {
        params: { id: 1 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 400);
    assert.equal(result.body, "Product 10 is not in this warehouse");

    assert.equal(queries.includes("ROLLBACK"), true);
  } finally {
    pg.connect = originalConnect;
  }
});

test("processOrder rejects insufficient inventory", async () => {
  const originalConnect = pg.connect;

  const queries = [];

  const transaction = {
    query: async (query) => {
      queries.push(query);

      if (
        query.includes("FROM orders") &&
        query.includes("FOR UPDATE") &&
        !query.includes("FROM orders_items")
      ) {
        return {
          rows: [
            {
              id: 1,
              status: "pending",
              warehouse_id: 20,
            },
          ],
        };
      }

      if (query.includes("FROM orders_items")) {
        return {
          rows: [
            {
              product_id: 10,
              quantity: 10,
            },
          ],
        };
      }

      if (query.includes("FROM inventory") && query.includes("FOR UPDATE")) {
        return {
          rows: [
            {
              id: 100,
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
    await controller.processOrder(
      {
        params: { id: 1 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 400);
    assert.equal(result.body, "Not enough stock for product 10");

    assert.equal(queries.includes("ROLLBACK"), true);
  } finally {
    pg.connect = originalConnect;
  }
});
