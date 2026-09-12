const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/orders.js");

test("exports create, id, and customerId validators", () => {
  assert.ok(validators.create);
  assert.ok(validators.id);
  assert.ok(validators.customerId);
});

test("create validates customer ID", () => {
  assert.deepEqual(validators.create.body.customer_id, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create validates warehouse ID", () => {
  assert.deepEqual(validators.create.body.warehouse_id, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("id validates a positive order ID", () => {
  assert.deepEqual(validators.id.params.id, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("customerId validates a positive customer ID parameter", () => {
  assert.deepEqual(validators.customerId.params.id, {
    type: "number",
    integer: true,
    min: 1,
  });
});
