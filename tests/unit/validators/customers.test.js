const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/customers.js");

test("exports create, update, and id validators", () => {
  assert.ok(validators.create);
  assert.ok(validators.update);
  assert.ok(validators.id);
});

test("create validates customer name", () => {
  const rule = validators.create.body.customer_name;

  assert.equal(rule.type, "string");
  assert.equal(rule.minLength, 2);
});

test("create validates customer email", () => {
  const rule = validators.create.body.customer_email;

  assert.equal(rule.type, "string");
  assert.equal(rule.email, true);
  assert.equal(rule.maxLength, 254);
});

test("create validates shipping address", () => {
  const rule = validators.create.body.shipping_address;

  assert.equal(rule.type, "string");
  assert.equal(rule.minLength, 5);
});

test("update validates positive customer ID", () => {
  assert.deepEqual(validators.update.params.id, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("update contains all customer fields", () => {
  assert.ok(validators.update.body.customer_name);
  assert.ok(validators.update.body.customer_email);
  assert.ok(validators.update.body.shipping_address);
});

test("id validates a positive integer", () => {
  assert.deepEqual(validators.id.params.id, {
    type: "number",
    integer: true,
    min: 1,
  });
});
//
