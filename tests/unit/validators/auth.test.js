const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/auth.js");

test("exports register, login, and verifyAccount validators", () => {
  assert.ok(validators.register);
  assert.ok(validators.login);
  assert.ok(validators.verifyAccount);
});

test("register validates all required fields", () => {
  const { body } = validators.register;

  assert.ok(body.customer_name);
  assert.ok(body.username);
  assert.ok(body.email);
  assert.ok(body.password);
  assert.ok(body.shipping_address);
});

test("register customer_name requires at least 2 characters", () => {
  assert.equal(validators.register.body.customer_name.minLength, 2);
});

test("register username requires 3-30 alphanumeric or underscore characters", () => {
  const username = validators.register.body.username;

  assert.equal(username.type, "string");
  assert.equal(username.minLength, 3);
  assert.equal(username.maxLength, 30);

  assert.equal(username.pattern.test("user_123"), true);
  assert.equal(username.pattern.test("user-name"), false);
  assert.equal(username.pattern.test("user name"), false);
});

test("register password requires at least 8 characters", () => {
  assert.equal(validators.register.body.password.minLength, 8);
});

test("register shipping_address requires at least 5 characters", () => {
  assert.equal(validators.register.body.shipping_address.minLength, 5);
});

test("register email uses the common email validator", () => {
  const email = validators.register.body.email;

  assert.equal(email.type, "string");
  assert.equal(email.email, true);
  assert.equal(email.maxLength, 254);
});

test("login validates email and password", () => {
  assert.ok(validators.login.body.email);
  assert.ok(validators.login.body.password);

  assert.equal(validators.login.body.password.type, "string");
  assert.equal(validators.login.body.password.minLength, 1);
});

test("verifyAccount validates token in query parameters", () => {
  const token = validators.verifyAccount.query.token;

  assert.equal(token.type, "string");
  assert.equal(token.minLength, 1);
});
//
