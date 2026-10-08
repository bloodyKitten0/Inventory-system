const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/Stock-movements.js");

const positiveInteger = {
  type: "number",
  integer: true,
  min: 1,
};

test("exports id, productId, and warehouseId validators", () => {
  assert.ok(validators.id);
  assert.ok(validators.productId);
  assert.ok(validators.warehouseId);
});

test("id validates a positive movement ID", () => {
  assert.deepEqual(validators.id.params.id, positiveInteger);
});

test("productId validates a positive product ID", () => {
  assert.deepEqual(validators.productId.params.id, positiveInteger);
});

test("warehouseId validates a positive warehouse ID", () => {
  assert.deepEqual(validators.warehouseId.params.id, positiveInteger);
});
