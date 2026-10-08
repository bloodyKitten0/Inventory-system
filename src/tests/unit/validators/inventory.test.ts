import test from "node:test";
import assert from "node:assert/strict";

import * as validators from "../../../validators/inventory.js";

test("exports all inventory validators", () => {
  assert.ok(validators.id);
  assert.ok(validators.create);
  assert.ok(validators.update);
  assert.ok(validators.adjust);
  assert.ok(validators.lowStock);
  assert.ok(validators.checkAvailability);
});

test("id validates a positive integer", () => {
  assert.deepEqual(validators.id.params.id, {
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

test("create validates warehouse ID", () => {
  assert.deepEqual(validators.create.body.warehouse_id, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create validates non-negative amount", () => {
  assert.deepEqual(validators.create.body.quantity, {
    required: true,
    type: "number",
    finite: true,
    min: 0,
  });
});

test("update validates ID, product, warehouse, and amount", () => {
  assert.ok(validators.update.params.id);
  assert.ok(validators.update.body.product_id);
  assert.ok(validators.update.body.warehouse_id);
  assert.ok(validators.update.body.quantity);
});

test("adjust requires a finite non-zero number", () => {
  const rule = validators.adjust.body.change;

  assert.equal(rule.type, "number");
  assert.equal(rule.finite, true);
  assert.equal(rule.notEqual, 0);
});

test("lowStock validates the below parameter as non-negative", () => {
  assert.deepEqual(validators.lowStock.params.below, {
    required: true,
    type: "number",
    finite: true,
    min: 0,
  });
});

test("checkAvailability validates amount, product, and warehouse", () => {
  assert.deepEqual(validators.checkAvailability.body.quantity, {
    required: true,
    type: "number",
    finite: true,
    min: 0,
  });

  assert.deepEqual(validators.checkAvailability.body.product_id, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });

  assert.deepEqual(validators.checkAvailability.body.warehouse_id, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});

test("inventory validators use the same field names as the API", () => {
  assert.deepEqual(Object.keys(validators.create.body).sort(), [
    "product_id",
    "quantity",
    "warehouse_id",
  ]);

  assert.deepEqual(Object.keys(validators.checkAvailability.body).sort(), [
    "product_id",
    "quantity",
    "warehouse_id",
  ]);
});

test("adjust requires the change field", () => {
  assert.equal(validators.adjust.body.change.required, true);
});
