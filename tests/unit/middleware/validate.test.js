const test = require("node:test");
const assert = require("node:assert/strict");
const validate = require("../../../middlewares/validate");

function runValidator(schema, req = {}) {
  let statusCode;
  let responseBody;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },

    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  const middleware = validate(schema);

  middleware(req, res, next);

  return {
    statusCode,
    responseBody,
    nextCalled,
  };
}
test("required field accepts a valid value", () => {
  const result = runValidator(
    {
      body: {
        name: {
          required: true,
          type: "string",
        },
      },
    },
    {
      body: {
        name: "John",
      },
    },
  );

  assert.equal(result.nextCalled, true);
  assert.equal(result.statusCode, undefined);
});
test("required field rejects undefined", () => {
  const result = runValidator(
    {
      body: {
        name: {
          required: true,
          type: "string",
        },
      },
    },
    {
      body: {},
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);

  assert.deepEqual(result.responseBody.errors, [
    {
      field: "name",
      source: "body",
      message: "name is required",
    },
  ]);
});
test("required field rejects null", () => {
  const result = runValidator(
    {
      body: {
        name: {
          required: true,
          type: "string",
        },
      },
    },
    {
      body: {
        name: null,
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("required field rejects empty string", () => {
  const result = runValidator(
    {
      body: {
        name: {
          required: true,
          type: "string",
        },
      },
    },
    {
      body: {
        name: "",
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("required numeric field accepts zero", () => {
  const result = runValidator(
    {
      body: {
        quantity: {
          required: true,
          type: "number",
        },
      },
    },
    {
      body: {
        quantity: 0,
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("optional field can be omitted", () => {
  const result = runValidator(
    {
      body: {
        name: {
          required: false,
          type: "string",
        },
      },
    },
    {
      body: {},
    },
  );

  assert.equal(result.nextCalled, true);
});
test("optional null field is ignored", () => {
  const result = runValidator(
    {
      body: {
        name: {
          required: false,
          type: "string",
        },
      },
    },
    {
      body: {
        name: null,
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("optional empty string is ignored", () => {
  const result = runValidator(
    {
      body: {
        name: {
          required: false,
          type: "string",
        },
      },
    },
    {
      body: {
        name: "",
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("type rule accepts correct type", () => {
  const result = runValidator(
    {
      body: {
        age: {
          type: "number",
        },
      },
    },
    {
      body: {
        age: 20,
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("type rule rejects incorrect type", () => {
  const result = runValidator(
    {
      body: {
        age: {
          type: "number",
        },
      },
    },
    {
      body: {
        age: "20",
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);

  assert.deepEqual(result.responseBody.errors[0], {
    field: "age",
    source: "body",
    message: "age must be a number",
  });
});
test("trim rule accepts string without surrounding whitespace", () => {
  const result = runValidator(
    {
      body: {
        name: {
          type: "string",
          trim: true,
        },
      },
    },
    {
      body: {
        name: "John",
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("trim rule rejects leading whitespace", () => {
  const result = runValidator(
    {
      body: {
        name: {
          type: "string",
          trim: true,
        },
      },
    },
    {
      body: {
        name: " John",
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("trim rule rejects trailing whitespace", () => {
  const result = runValidator(
    {
      body: {
        name: {
          type: "string",
          trim: true,
        },
      },
    },
    {
      body: {
        name: "John ",
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("minLength accepts value at the minimum boundary", () => {
  const result = runValidator(
    {
      body: {
        username: {
          type: "string",
          minLength: 5,
        },
      },
    },
    {
      body: {
        username: "abcde",
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("minLength rejects value below the minimum boundary", () => {
  const result = runValidator(
    {
      body: {
        username: {
          type: "string",
          minLength: 5,
        },
      },
    },
    {
      body: {
        username: "abcd",
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("minLength uses trimmed length", () => {
  const result = runValidator(
    {
      body: {
        username: {
          type: "string",
          minLength: 5,
        },
      },
    },
    {
      body: {
        username: " abcde ",
      },
    },
  );
  assert.equal(result.nextCalled, true);
});
test("maxLength accepts value at the maximum boundary", () => {
  const result = runValidator(
    {
      body: {
        username: {
          type: "string",
          maxLength: 5,
        },
      },
    },
    {
      body: {
        username: "abcde",
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("maxLength rejects value above the maximum boundary", () => {
  const result = runValidator(
    {
      body: {
        username: {
          type: "string",
          maxLength: 5,
        },
      },
    },
    {
      body: {
        username: "abcdef",
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("pattern accepts matching value", () => {
  const result = runValidator(
    {
      body: {
        code: {
          type: "string",
          pattern: /^[A-Z]{3}$/,
        },
      },
    },
    {
      body: {
        code: "ABC",
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("pattern rejects non-matching value", () => {
  const result = runValidator(
    {
      body: {
        code: {
          type: "string",
          pattern: /^[A-Z]{3}$/,
        },
      },
    },
    {
      body: {
        code: "abc",
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("integer accepts an integer", () => {
  const result = runValidator(
    {
      body: {
        quantity: {
          type: "number",
          integer: true,
        },
      },
    },
    {
      body: {
        quantity: 10,
      },
    },
  );

  assert.equal(result.nextCalled, true);
});

test("integer rejects a decimal", () => {
  const result = runValidator(
    {
      body: {
        quantity: {
          type: "number",
          integer: true,
        },
      },
    },
    {
      body: {
        quantity: 10.5,
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("min accepts value at the exact minimum boundary", () => {
  const result = runValidator(
    {
      body: {
        quantity: {
          type: "number",
          min: 10,
        },
      },
    },
    {
      body: {
        quantity: 10,
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("min rejects value below the minimum boundary", () => {
  const result = runValidator(
    {
      body: {
        quantity: {
          type: "number",
          min: 10,
        },
      },
    },
    {
      body: {
        quantity: 9,
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("max accepts value at the exact maximum boundary", () => {
  const result = runValidator(
    {
      body: {
        quantity: {
          type: "number",
          max: 10,
        },
      },
    },
    {
      body: {
        quantity: 10,
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("max rejects value above the maximum boundary", () => {
  const result = runValidator(
    {
      body: {
        quantity: {
          type: "number",
          max: 10,
        },
      },
    },
    {
      body: {
        quantity: 11,
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("finite accepts a finite number", () => {
  const result = runValidator(
    {
      body: {
        value: {
          type: "number",
          finite: true,
        },
      },
    },
    {
      body: {
        value: 100,
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("finite rejects Infinity", () => {
  const result = runValidator(
    {
      body: {
        value: {
          type: "number",
          finite: true,
        },
      },
    },
    {
      body: {
        value: Infinity,
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("finite rejects negative Infinity", () => {
  const result = runValidator(
    {
      body: {
        value: {
          type: "number",
          finite: true,
        },
      },
    },
    {
      body: {
        value: -Infinity,
      },
    },
  );

  assert.equal(result.nextCalled, false);
});
test("email accepts a valid email", () => {
  const result = runValidator(
    {
      body: {
        email: {
          type: "string",
          email: true,
        },
      },
    },
    {
      body: {
        email: "user@example.com",
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("email rejects an invalid email", () => {
  const result = runValidator(
    {
      body: {
        email: {
          type: "string",
          email: true,
        },
      },
    },
    {
      body: {
        email: "not-an-email",
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("email accepts surrounding whitespace", () => {
  const result = runValidator(
    {
      body: {
        email: {
          type: "string",
          email: true,
        },
      },
    },
    {
      body: {
        email: " user@example.com ",
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("enum accepts an allowed value", () => {
  const result = runValidator(
    {
      body: {
        role: {
          enum: ["admin", "user"],
        },
      },
    },
    {
      body: {
        role: "admin",
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("enum rejects a value outside the allowed values", () => {
  const result = runValidator(
    {
      body: {
        role: {
          enum: ["admin", "user"],
        },
      },
    },
    {
      body: {
        role: "guest",
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);

  assert.deepEqual(result.responseBody.errors[0], {
    field: "role",
    source: "body",
    message: "role must be one of: admin, user",
  });
});
test("custom validation accepts true", () => {
  const result = runValidator(
    {
      body: {
        password: {
          custom: (value) => value.length >= 8,
        },
      },
    },
    {
      body: {
        password: "password123",
      },
    },
  );

  assert.equal(result.nextCalled, true);
});

test("custom validation rejects false", () => {
  const result = runValidator(
    {
      body: {
        password: {
          custom: () => false,
        },
      },
    },
    {
      body: {
        password: "abc",
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});

test("custom validation can return a custom error message", () => {
  const result = runValidator(
    {
      body: {
        age: {
          custom: () => "Age is too low",
        },
      },
    },
    {
      body: {
        age: 10,
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.responseBody.errors[0].message, "Age is too low");
});
test("validator reads values from params", () => {
  const result = runValidator(
    {
      params: {
        id: {
          type: "number",
        },
      },
    },
    {
      params: {
        id: 10,
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("validator reads values from query", () => {
  const result = runValidator(
    {
      query: {
        limit: {
          type: "number",
          min: 1,
        },
      },
    },
    {
      query: {
        limit: 10,
      },
    },
  );

  assert.equal(result.nextCalled, true);
});
test("validator handles missing body", () => {
  const result = runValidator({
    body: {
      name: {
        required: false,
        type: "string",
      },
    },
  });

  assert.equal(result.nextCalled, true);
});
test("validator reports multiple validation errors", () => {
  const result = runValidator(
    {
      body: {
        username: {
          required: true,
          type: "string",
          minLength: 5,
        },

        age: {
          required: true,
          type: "number",
          min: 18,
        },
      },
    },
    {
      body: {
        username: "",
        age: 10,
      },
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);

  assert.equal(result.responseBody.message, "Validation failed");
  assert.equal(result.responseBody.errors.length, 2);
});
test("validator preserves the order of validation errors", () => {
  const result = runValidator(
    {
      body: {
        first: {
          required: true,
        },

        second: {
          required: true,
        },
      },
    },
    {
      body: {},
    },
  );
  assert.deepEqual(result.responseBody.errors, [
    {
      field: "first",
      source: "body",
      message: "first is required",
    },
    {
      field: "second",
      source: "body",
      message: "second is required",
    },
  ]);
});
test("successful validation calls next and does not send a response", () => {
  const result = runValidator(
    {
      body: {
        name: {
          required: true,
          type: "string",
        },
      },
    },
    {
      body: {
        name: "John",
      },
    },
  );

  assert.equal(result.nextCalled, true);
  assert.equal(result.statusCode, undefined);
  assert.equal(result.responseBody, undefined);
});
test("failed validation does not call next", () => {
  const result = runValidator(
    {
      body: {
        name: {
          required: true,
        },
      },
    },
    {
      body: {},
    },
  );

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.responseBody.message, "Validation failed");
});
test("notEqual accepts a value different from the forbidden value", () => {
  const result = runValidator(
    { body: { status: { notEqual: "deleted" } } },
    { body: { status: "active" } },
  );
  assert.equal(result.nextCalled, true);
});
test("notEqual rejects the forbidden value", () => {
  const result = runValidator(
    { body: { status: { notEqual: "deleted" } } },
    { body: { status: "deleted" } },
  );
  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.responseBody.errors[0], {
    field: "status",
    source: "body",
    message: "status must not equal deleted",
  });
});
test("notEqual correctly handles zero as the forbidden value", () => {
  const result = runValidator(
    { body: { quantity: { notEqual: 0 } } },
    { body: { quantity: 0 } },
  );
  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
test("notEqual accepts zero when the forbidden value is different", () => {
  const result = runValidator(
    { body: { quantity: { notEqual: 1 } } },
    { body: { quantity: 0 } },
  );
  assert.equal(result.nextCalled, true);
});
