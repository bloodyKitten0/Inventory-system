import test from "node:test";
import assert from "node:assert/strict";

import tryCatch from "../../../services/try-catch.js";
import { asMockHandler } from "../../helpers.js";

test("calls the wrapped callback", async () => {
  let callbackCalled = false;

  const callback = async () => {
    callbackCalled = true;
  };

  const middleware = tryCatch(callback);

  await asMockHandler(middleware)({}, {}, () => {});

  assert.equal(callbackCalled, true);
});

test("passes req to the wrapped callback", async () => {
  let receivedReq: unknown;

  const req = {
    body: {
      name: "John",
    },
  };

  const callback = async (request: unknown) => {
    receivedReq = request;
  };

  const middleware = tryCatch(callback);

  await asMockHandler(middleware)(req, {}, () => {});

  assert.equal(receivedReq, req);
});

test("passes res to the wrapped callback", async () => {
  let receivedRes: unknown;

  const res = {
    status() {
      return this;
    },
  };

  const callback = async (req: unknown, response: unknown) => {
    receivedRes = response;
  };

  const middleware = tryCatch(callback);

  await asMockHandler(middleware)({}, res, () => {});

  assert.equal(receivedRes, res);
});

test("passes next to the wrapped callback", async () => {
  let receivedNext: unknown;

  const next = () => {};

  const callback = async (req: unknown, res: unknown, callbackNext: unknown) => {
    receivedNext = callbackNext;
  };

  const middleware = tryCatch(callback);

  await asMockHandler(middleware)({}, {}, next);

  assert.equal(receivedNext, next);
});

test("waits for an asynchronous callback", async () => {
  let completed = false;

  const callback = async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    completed = true;
  };

  const middleware = tryCatch(callback);

  await asMockHandler(middleware)({}, {}, () => {});

  assert.equal(completed, true);
});

test("calls next with the thrown error", async () => {
  const error = new Error("Something went wrong");

  let receivedError: unknown;

  const callback = async () => {
    throw error;
  };

  const next = (err: unknown) => {
    receivedError = err;
  };

  const middleware = tryCatch(callback);

  await asMockHandler(middleware)({}, {}, next);

  assert.equal(receivedError, error);
});

test("does not call next when the callback succeeds", async () => {
  let nextCalled = false;

  const callback = async () => {};

  const next = () => {
    nextCalled = true;
  };

  const middleware = tryCatch(callback);

  await asMockHandler(middleware)({}, {}, next);

  assert.equal(nextCalled, false);
});

test("does not throw the callback error to the caller", async () => {
  const error = new Error("Callback failed");

  const callback = async () => {
    throw error;
  };

  let receivedError: unknown;

  const next = (err: unknown) => {
    receivedError = err;
  };

  const middleware = tryCatch(callback);

  await assert.doesNotReject(asMockHandler(middleware)({}, {}, next));

  assert.equal(receivedError, error);
});
