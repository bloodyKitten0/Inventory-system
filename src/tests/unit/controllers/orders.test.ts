import test from "node:test";
import assert from "node:assert/strict";

import pg from "../../../config/db.js";
import * as controllerModule from "../../../controllers/orders.js";

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
    assert.equal(typeof (controllerModule as Record<string, unknown>)[name], "function");
  }
});

test("create creates a pending order and returns 201", async () => {
  const originalQuery = db.query;

  const order = {
    id: 1,
    customer_id: 10,
    warehouse_id: 20,
    status: "pending",
  };

  let parameters: unknown;

  db.query = async (query: string, values: unknown[]) => {
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
          customer_id: 10,
          warehouse_id: 20,
        },
      },
      result.res,
      () => {},
    );

    assert.deepEqual(parameters, [10, 20]);
    assert.equal(result.statusCode, 201);
    assert.deepEqual(result.body, order);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 200 when order exists", async () => {
  const originalQuery = db.query;

  const order = {
    id: 1,
    customer_id: 10,
    warehouse_id: 20,
    status: "processing",
  };

  db.query = async () => ({
    rows: [order],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 1 },
        body: {
          customer_id: 10,
          warehouse_id: 20,
          status: "processing",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, order);
  } finally {
    db.query = originalQuery;
  }
});

test("update returns 404 when order does not exist", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [],
  });

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 999 },
        body: {
          customer_id: 10,
          warehouse_id: 20,
          status: "processing",
        },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body, "order not found");
  } finally {
    db.query = originalQuery;
  }
});

test("updateStatus updates the order status", async () => {
  const originalQuery = db.query;

  const order = {
    id: 1,
    status: "completed",
  };

  let parameters: unknown;

  db.query = async (query: string, values: unknown[]) => {
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
    db.query = originalQuery;
  }
});

test("cancelOrder cancels a pending order", async () => {
  const originalQuery = db.query;

  const order = {
    id: 1,
    status: "cancelled",
  };

  db.query = async () => ({
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
    db.query = originalQuery;
  }
});

test("cancelOrder returns 404 when order cannot be cancelled", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
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
    db.query = originalQuery;
  }
});

test("orderDetails returns order details", async () => {
  const originalQuery = db.query;

  const rows = [
    {
      id: 1,
      product_id: 10,
      quantity: 2,
    },
  ];

  db.query = async () => ({
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
    db.query = originalQuery;
  }
});

test("calculateOrderTotal returns calculated total", async () => {
  const originalQuery = db.query;

  const row = {
    order_id: 1,
    total: "100",
  };

  db.query = async () => ({
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
    db.query = originalQuery;
  }
});

test("processOrder returns 404 when order does not exist", async () => {
  const originalConnect = db.connect;

  const queries: unknown[] = [];

  const transaction = {
    query: async (query: string) => {
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

  db.connect = async () => transaction;

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
    db.connect = originalConnect;
  }
});

test("processOrder rejects orders that are not pending", async () => {
  const originalConnect = db.connect;

  const queries: unknown[] = [];

  const transaction = {
    query: async (query: string) => {
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

  db.connect = async () => transaction;

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
    db.connect = originalConnect;
  }
});

test("processOrder rejects an order with no items", async () => {
  const originalConnect = db.connect;

  const queries: unknown[] = [];

  const transaction = {
    query: async (query: string) => {
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

  db.connect = async () => transaction;

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
    db.connect = originalConnect;
  }
});

test("processOrder rejects an item missing from the warehouse", async () => {
  const originalConnect = db.connect;

  const queries: unknown[] = [];

  const transaction = {
    query: async (query: string) => {
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

  db.connect = async () => transaction;

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
    db.connect = originalConnect;
  }
});

test("processOrder rejects insufficient inventory", async () => {
  const originalConnect = db.connect;

  const queries: unknown[] = [];

  const transaction = {
    query: async (query: string) => {
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

  db.connect = async () => transaction;

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
    db.connect = originalConnect;
  }
});

test("update rejects setting status to processing directly", async () => {
  const originalQuery = db.query;

  db.query = async (query: string) => {
    if (query.includes("SELECT * FROM orders")) {
      return {
        rows: [{ id: 1, customer_id: 10, warehouse_id: 20, status: "pending" }],
      };
    }
    return { rows: [] };
  };

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 1 },
        body: { status: "processing" },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 400);
    assert.deepEqual(result.body, {
      message: "Orders cannot change status to processing without processing inventory",
    });
  } finally {
    db.query = originalQuery;
  }
});

test("update rejects resetting processed order to pending", async () => {
  const originalQuery = db.query;

  db.query = async (query: string) => {
    if (query.includes("SELECT * FROM orders")) {
      return {
        rows: [{ id: 1, customer_id: 10, warehouse_id: 20, status: "processing" }],
      };
    }
    return { rows: [] };
  };

  const result = response();

  try {
    await controller.update(
      {
        params: { id: 1 },
        body: { status: "pending" },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 400);
    assert.deepEqual(result.body, {
      message: "Processed orders cannot be reset to pending",
    });
  } finally {
    db.query = originalQuery;
  }
});

test("cancelOrder restores inventory when cancelling processing order", async () => {
  const originalQuery = db.query;
  const queries: string[] = [];

  db.query = async (query: string) => {
    queries.push(query);

    if (query.includes("SELECT * FROM orders WHERE id = $1")) {
      return {
        rows: [{ id: 1, customer_id: 10, warehouse_id: 20, status: "processing" }],
      };
    }

    if (query.includes("SELECT * FROM orders_items WHERE order_id = $1")) {
      return {
        rows: [{ id: 101, product_id: 5, quantity: 2, order_id: 1 }],
      };
    }

    return {
      rows: [{ id: 1, status: "cancelled" }],
    };
  };

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
    assert.equal(
      queries.some((q) => q.includes("UPDATE inventory SET amount = amount + $1")),
      true,
    );
    assert.equal(
      queries.some((q) => q.includes("INSERT INTO stock_movements")),
      true,
    );
  } finally {
    db.query = originalQuery;
  }
});

test("cancelOrder rejects cancelling shipped or delivered orders", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [{ id: 1, customer_id: 10, warehouse_id: 20, status: "shipped" }],
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

    assert.equal(result.statusCode, 400);
    assert.deepEqual(result.body, {
      message: "Order cannot be cancelled in its current state",
    });
  } finally {
    db.query = originalQuery;
  }
});

test("cancelOrder returns 403 when customer does not own order", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [{ id: 1, customer_id: 10, warehouse_id: 20, status: "pending" }],
  });

  const result = response();

  try {
    await controller.cancelOrder(
      {
        params: { id: 1 },
        user: { customerId: 99 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 403);
    assert.deepEqual(result.body, { message: "Forbidden" });
  } finally {
    db.query = originalQuery;
  }
});

test("orderDetails returns empty array when order exists with no items", async () => {
  const originalQuery = db.query;

  db.query = async (query: string) => {
    if (query.includes("SELECT * FROM orders WHERE id = $1")) {
      return { rows: [{ id: 1, customer_id: 10, status: "pending" }] };
    }
    return { rows: [] };
  };

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
    assert.deepEqual(result.body, []);
  } finally {
    db.query = originalQuery;
  }
});

test("calculateOrderTotal returns total 0 when order exists with no items", async () => {
  const originalQuery = db.query;

  db.query = async (query: string) => {
    if (query.includes("SELECT * FROM orders WHERE id = $1")) {
      return { rows: [{ id: 1, customer_id: 10, status: "pending" }] };
    }
    return { rows: [] };
  };

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
    assert.deepEqual(result.body, {
      order_id: 1,
      total: "0",
    });
  } finally {
    db.query = originalQuery;
  }
});

test("calculateOrderTotal returns 404 when order does not exist", async () => {
  const originalQuery = db.query;

  db.query = async () => ({ rows: [] });

  const result = response();

  try {
    await controller.calculateOrderTotal(
      {
        params: { id: 999 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body, "order not found");
  } finally {
    db.query = originalQuery;
  }
});

test("calculateOrderTotal returns 403 when customer does not own order", async () => {
  const originalQuery = db.query;

  db.query = async () => ({
    rows: [{ id: 1, customer_id: 10, status: "pending" }],
  });

  const result = response();

  try {
    await controller.calculateOrderTotal(
      {
        params: { id: 1 },
        user: { customerId: 99 },
      },
      result.res,
      () => {},
    );

    assert.equal(result.statusCode, 403);
    assert.deepEqual(result.body, { message: "Forbidden" });
  } finally {
    db.query = originalQuery;
  }
});
