const test = require("node:test");
const assert = require("node:assert/strict");

const validators = require("../../../validators/roles.js");

const positiveInteger = {
  type: "number",
  integer: true,
  min: 1,
};

test("exports all role validators", () => {
  assert.ok(validators.roleId);
  assert.ok(validators.createRole);
  assert.ok(validators.grantPermission);
  assert.ok(validators.revokePermission);
  assert.ok(validators.accountId);
  assert.ok(validators.grantRole);
  assert.ok(validators.revokeRole);
});

test("roleId validates a positive role ID", () => {
  assert.deepEqual(validators.roleId.params.id, positiveInteger);
});

test("createRole requires a role name of at least 2 characters", () => {
  assert.equal(validators.createRole.body.name.type, "string");
  assert.equal(validators.createRole.body.name.minLength, 2);
});

test("grantPermission validates role ID", () => {
  assert.deepEqual(validators.grantPermission.params.id, positiveInteger);
});

test("grantPermission validates permission ID", () => {
  assert.deepEqual(
    validators.grantPermission.body.permissionId,
    positiveInteger,
  );
});

test("revokePermission validates role and permission IDs", () => {
  assert.deepEqual(validators.revokePermission.params.id, positiveInteger);

  assert.deepEqual(
    validators.revokePermission.params.permissionId,
    positiveInteger,
  );
});

test("accountId validates a positive account ID", () => {
  assert.deepEqual(validators.accountId.params.accountId, positiveInteger);
});

test("grantRole validates account ID", () => {
  assert.deepEqual(validators.grantRole.params.accountId, positiveInteger);
});

test("grantRole validates role ID", () => {
  assert.deepEqual(validators.grantRole.body.roleId, positiveInteger);
});

test("revokeRole validates account and role IDs", () => {
  assert.deepEqual(validators.revokeRole.params.accountId, positiveInteger);

  assert.deepEqual(validators.revokeRole.params.roleId, positiveInteger);
});
//
