const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/categories.js");

test("exports create, update, and id validators", () => {
  assert.ok(validators.create);
  assert.ok(validators.update);
  assert.ok(validators.id);
});

test("create validates category name and description", () => {
  const { body } = validators.create;

  assert.equal(body.name.type, "string");
  assert.equal(body.name.minLength, 1);

  assert.equal(body.description.type, "string");
});

test("update validates positive category ID", () => {
  assert.deepEqual(validators.update.params.id, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("update validates name and description", () => {
  assert.equal(validators.update.body.name.minLength, 1);
  assert.equal(validators.update.body.description.type, "string");
});

test("id validates a positive integer ID", () => {
  assert.deepEqual(validators.id.params.id, {
    type: "number",
    integer: true,
    min: 1,
  });
});
//
