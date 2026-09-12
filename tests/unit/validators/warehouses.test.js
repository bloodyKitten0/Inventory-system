const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/warehouses.js");

test("exports create, update, and id validators", () => {
  assert.ok(validators.create);
  assert.ok(validators.update);
  assert.ok(validators.id);
});

test("create validates warehouse name", () => {
  const rule = validators.create.body.name;

  assert.equal(rule.type, "string");
  assert.equal(rule.minLength, 2);
});

test("create validates warehouse location", () => {
  const rule = validators.create.body.location;

  assert.equal(rule.type, "string");
  assert.equal(rule.minLength, 2);
});

test("update validates positive warehouse ID", () => {
  assert.deepEqual(validators.update.params.id, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("update validates name and location", () => {
  assert.ok(validators.update.body.name);
  assert.ok(validators.update.body.location);

  assert.equal(validators.update.body.name.minLength, 2);
  assert.equal(validators.update.body.location.minLength, 2);
});

test("id validates a positive integer", () => {
  assert.deepEqual(validators.id.params.id, {
    type: "number",
    integer: true,
    min: 1,
  });
});
