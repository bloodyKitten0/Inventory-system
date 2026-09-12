const test = require("node:test");
const assert = require("node:assert/strict");

const {
  positiveInteger,
  nonNegativeNumber,
  positiveNumber,
  requiredString,
  email,
} = require("../../../validators/common.js");

test("positiveInteger has the correct validation rules", () => {
  assert.deepEqual(positiveInteger, {
    type: "number",
    integer: true,
    min: 1,
  });
});

test("nonNegativeNumber has the correct validation rules", () => {
  assert.deepEqual(nonNegativeNumber, {
    type: "number",
    finite: true,
    min: 0,
  });
});

test("positiveNumber has the correct validation rules", () => {
  assert.deepEqual(positiveNumber, {
    type: "number",
    finite: true,
    min: 0.000001,
  });
});

test("requiredString creates a string rule with the requested minimum length", () => {
  const rule = requiredString(5);

  assert.equal(rule.type, "string");
  assert.equal(rule.minLength, 5);
});

test("requiredString includes maxLength when provided", () => {
  const rule = requiredString(2, 20);

  assert.equal(rule.type, "string");
  assert.equal(rule.minLength, 2);
  assert.equal(rule.maxLength, 20);
});

test("requiredString omits maxLength when it is not provided", () => {
  const rule = requiredString(2);

  assert.equal("maxLength" in rule, false);
});

test("email has string type and email validation", () => {
  assert.equal(email.type, "string");
  assert.equal(email.email, true);
  assert.equal(email.maxLength, 254);
});
//
