const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/suppliers.js");

test("exports create, update, and id validators", () => {
  assert.ok(validators.create);
  assert.ok(validators.update);
  assert.ok(validators.id);
});

test("create validates supplier name", () => {
  const rule = validators.create.body.supplier_name;

  assert.equal(rule.type, "string");
  assert.equal(rule.minLength, 2);
});

test("create validates supplier email", () => {
  const rule = validators.create.body.supplier_email;

  assert.equal(rule.type, "string");
  assert.equal(rule.email, true);
  assert.equal(rule.maxLength, 254);
});

test("create validates supplier phone", () => {
  const rule = validators.create.body.supplier_phone;

  assert.equal(rule.type, "string");
  assert.equal(rule.minLength, 3);
});

test("update validates positive supplier ID", () => {
  assert.deepEqual(validators.update.params.id, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("update validates supplier fields", () => {
  assert.ok(validators.update.body.supplier_name);
  assert.ok(validators.update.body.supplier_email);
  assert.ok(validators.update.body.supplier_phone);
});

test("id validates a positive integer", () => {
  assert.deepEqual(validators.id.params.id, {
    type: "number",
    integer: true,
    min: 1,
  });
});
