import test from "node:test";
import assert from "node:assert/strict";
import app from "../../../app.js";

const makeResponse = () => {
  let statusCode: number | undefined;
  let body: unknown;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: unknown) {
      body = data;
      return res;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
  };

  return res;
};

// Find the 404 handler and error handler middleware in app router stack
const stack = (app as any).router?.stack || (app as any)._router?.stack || [];
const route404Handler = [...stack].reverse().find(
  (layer: any) => layer.handle?.length === 2 && !layer.route,
)?.handle;

const errorHandler = stack.find(
  (layer: any) => layer.handle?.length === 4,
)?.handle;

test("app registers 404 middleware returning Route not found", () => {
  assert.equal(typeof route404Handler, "function");

  const res = makeResponse();
  route404Handler({}, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, {
    message: "Route not found",
  });
});

test("error handler maps foreign key violation (23503) to 400 without leaking details", () => {
  assert.equal(typeof errorHandler, "function");

  const res = makeResponse();
  const err = { code: "23503", detail: "Key (id)=(999) is not present in table." };

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    message: "Foreign key violation: referenced record does not exist",
  });
});

test("error handler maps unique violation (23505) to 409 without leaking details", () => {
  const res = makeResponse();
  const err = { code: "23505", detail: "Key (email)=(test@example.com) already exists." };

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, {
    message: "Resource already exists",
  });
});

test("error handler maps check constraint violation (23514) to 400 without leaking details", () => {
  const res = makeResponse();
  const err = { code: "23514", detail: "Failing row contains negative amount." };

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    message: "Check constraint violation",
  });
});

test("error handler maps invalid input syntax (22P02) to 400", () => {
  const res = makeResponse();
  const err = { code: "22P02" };

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    message: "Invalid input syntax for type",
  });
});

test("error handler respects custom status code and message", () => {
  const res = makeResponse();
  const err = { statusCode: 403, message: "Custom forbidden message" };

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    message: "Custom forbidden message",
  });
});

test("error handler defaults unhandled errors to 500 Internal server error", () => {
  const res = makeResponse();
  const err = new Error("Unexpected database crash");

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    message: "Internal server error",
  });
});
