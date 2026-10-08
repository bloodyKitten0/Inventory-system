import test from "node:test";
import assert from "node:assert/strict";

import {
  positiveInteger,
  nonNegativeNumber,
  positiveNumber,
  requiredString,
  email,
} from "../../../validators/common.js";

test("positiveInteger has the correct validation rules", () => {
  assert.deepEqual(positiveInteger, {
    required: true,
    type: "number",
    integer: true,
    min: 1,
  });
});

test("nonNegativeNumber has the correct validation rules", () => {
  assert.deepEqual(nonNegativeNumber, {
    required: true,
    type: "number",
    finite: true,
    min: 0,
  });
});

test("positiveNumber has the correct validation rules", () => {
  assert.deepEqual(positiveNumber, {
    required: true,
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

test("requiredString marks the field as required", () => {
  assert.equal(requiredString(2, 10).required, true);
});

test("email marks the field as required", () => {
  assert.equal(email.required, true);
});
