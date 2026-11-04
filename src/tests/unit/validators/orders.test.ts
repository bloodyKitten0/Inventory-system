import test from "node:test";
import assert from "node:assert/strict";

import * as validators from "../../../validators/orders.js";
import validate from "../../../middlewares/validate.js";
import { asMockHandler } from "../../helpers.js";

test("exports create, id, and customerId validators", () => {
  assert.ok(validators.create);
  assert.ok(validators.id);
  assert.ok(validators.customerId);
});

test("create validates customer ID", () => {
  assert.deepEqual(validators.create.body.customer_id, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create validates warehouse ID", () => {
  assert.deepEqual(validators.create.body.warehouse_id, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});

test("id validates a positive order ID", () => {
  assert.deepEqual(validators.id.params.id, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});

test("customerId validates a positive customer ID parameter", () => {
  assert.deepEqual(validators.customerId.params.id, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});

test("update requires customer, warehouse and a valid status", () => {
  assert.equal(validators.update.body.customer_id.required, true);
  assert.equal(validators.update.body.warehouse_id.required, true);
  assert.deepEqual(validators.update.body.status, {
    required: true,
    type: "string",
    enum: ["pending", "processing", "completed", "cancelled"],
  });
});

const runStatusValidator = (status: unknown) => {
  let statusCode: number | undefined;
  let nextCalled = false;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };

  asMockHandler(validate(validators.updateStatus))(
    { params: { id: "1" }, body: { status } },
    res,
    () => {
      nextCalled = true;
    },
  );

  return { statusCode, nextCalled };
};

test("updateStatus accepts every known order status", () => {
  for (const status of ["pending", "processing", "completed", "cancelled"]) {
    assert.equal(runStatusValidator(status).nextCalled, true);
  }
});

test("updateStatus rejects a status that is not in the list", () => {
  const result = runStatusValidator("shipped");

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});

test("updateStatus rejects a missing status", () => {
  const result = runStatusValidator(undefined);

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
