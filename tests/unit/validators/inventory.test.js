const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/inventory.js");

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
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create validates product ID", () => {
  assert.deepEqual(validators.create.body.pid, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create validates warehouse ID", () => {
  assert.deepEqual(validators.create.body.wid, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("create validates non-negative amount", () => {
  assert.deepEqual(validators.create.body.amo, {
    type: "number",
    finite: true,
    min: 0,
  });
});

test("update validates ID, product, warehouse, and amount", () => {
  assert.ok(validators.update.params.id);
  assert.ok(validators.update.body.pid);
  assert.ok(validators.update.body.wid);
  assert.ok(validators.update.body.amo);
});

test("adjust requires a finite non-zero number", () => {
  const rule = validators.adjust.body.change;

  assert.equal(rule.type, "number");
  assert.equal(rule.finite, true);
  assert.equal(rule.notEqual, 0);
});

test("lowStock validates the below parameter as non-negative", () => {
  assert.deepEqual(validators.lowStock.params.below, {
    type: "number",
    finite: true,
    min: 0,
  });
});

test("checkAvailability validates amount, product, and warehouse", () => {
  assert.deepEqual(validators.checkAvailability.body.amount, {
    type: "number",
    finite: true,
    min: 0,
  });

  assert.deepEqual(validators.checkAvailability.body.pid, {
    type: "number",
    integer: true,
    min: 1,
  });

  assert.deepEqual(validators.checkAvailability.body.wid, {
    type: "number",
    integer: true,
    min: 1,
  });
});
//
