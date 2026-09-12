const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/order-items.js");

test("exports create, update, and id validators", () => {
  assert.ok(validators.create);
  assert.ok(validators.update);
  assert.ok(validators.id);
});

test("create validates order ID", () => {
  assert.deepEqual(validators.create.body.order_id, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create validates product ID", () => {
  assert.deepEqual(validators.create.body.product_id, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create requires integer quantity of at least 1", () => {
  assert.deepEqual(validators.create.body.quantity, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create validates non-negative price", () => {
  assert.deepEqual(validators.create.body.price, {
    type: "number",
    finite: true,
    min: 0,
  });
});

test("update validates positive ID", () => {
  assert.deepEqual(validators.update.params.id, {
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
    type: "number",
    integer: true,
    min: 1,
  });
});
//
