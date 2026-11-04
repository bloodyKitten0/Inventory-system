import test from "node:test";
import assert from "node:assert/strict";

import * as validators from "../../../validators/order-items.js";

test("exports create, update, and id validators", () => {
  assert.ok(validators.create);
  assert.ok(validators.update);
  assert.ok(validators.id);
});

test("create validates order ID", () => {
  assert.deepEqual(validators.create.body.order_id, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create validates product ID", () => {
  assert.deepEqual(validators.create.body.product_id, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create requires integer quantity of at least 1", () => {
  assert.deepEqual(validators.create.body.quantity, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create validates non-negative price", () => {
  assert.deepEqual(validators.create.body.price, {
    required: true,
    type: "number",
    finite: true,
    min: 0,
  });
});

test("update validates positive ID", () => {
  assert.deepEqual(validators.update.params.id, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});

test("update validates quantity and price", () => {
  assert.ok(validators.update.body.quantity);
  assert.ok(validators.update.body.price);
});

test("id validates a positive integer", () => {
  assert.deepEqual(validators.id.params.id, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});
