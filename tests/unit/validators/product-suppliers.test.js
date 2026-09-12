const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/product-suppliers.js");

const positiveInteger = {
  type: "number",
  integer: true,
  min: 1,
};

const nonNegativeNumber = {
  type: "number",
  finite: true,
  min: 0,
};

test("exports all product-supplier validators", () => {
  assert.ok(validators.create);
  assert.ok(validators.update);
  assert.ok(validators.id);
  assert.ok(validators.productId);
  assert.ok(validators.supplierId);
});

test("create validates product ID", () => {
  assert.deepEqual(validators.create.body.product_id, positiveInteger);
});

test("create validates supplier ID", () => {
  assert.deepEqual(validators.create.body.supplier_id, positiveInteger);
});

test("create validates supplier price", () => {
  assert.deepEqual(validators.create.body.supplier_price, nonNegativeNumber);
});

test("update validates ID", () => {
  assert.deepEqual(validators.update.params.id, positiveInteger);
});

test("update validates product, supplier, and price", () => {
  assert.deepEqual(validators.update.body.product_id, positiveInteger);
  assert.deepEqual(validators.update.body.supplier_id, positiveInteger);
  assert.deepEqual(validators.update.body.supplier_price, nonNegativeNumber);
});

test("id validates a positive integer", () => {
  assert.deepEqual(validators.id.params.id, positiveInteger);
});

test("productId validates a positive product ID", () => {
  assert.deepEqual(validators.productId.params.id, positiveInteger);
});

test("supplierId validates a positive supplier ID", () => {
  assert.deepEqual(validators.supplierId.params.id, positiveInteger);
});
//
