const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/products.js");

test("exports create, update, and id validators", () => {
  assert.ok(validators.create);
  assert.ok(validators.update);
  assert.ok(validators.id);
});

test("create validates product name", () => {
  assert.equal(validators.create.body.name.type, "string");
  assert.equal(validators.create.body.name.minLength, 1);
});

test("create validates category ID as a positive integer", () => {
  assert.deepEqual(validators.create.body.category_id, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create validates description as a string", () => {
  assert.deepEqual(validators.create.body.description, {
    type: "string",
  });
});

test("create validates price as a non-negative finite number", () => {
  assert.deepEqual(validators.create.body.price, {
    type: "number",
    finite: true,
    min: 0,
  });
});

test("update validates positive product ID", () => {
  assert.deepEqual(validators.update.params.id, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("update validates all product fields", () => {
  assert.ok(validators.update.body.name);
  assert.ok(validators.update.body.category_id);
  assert.ok(validators.update.body.description);
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
