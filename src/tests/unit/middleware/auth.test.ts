import test, { mock } from "node:test";
import assert from "node:assert/strict";

import { asMockHandler } from "../../helpers.js";

type GetSession = (sessionId: string) => Promise<unknown>;

let getSession: GetSession = async () => null;

// middlewares/auth.ts calls sessions.getSession(). ES module exports cannot be
// reassigned, so the sessions module is replaced for this whole test file.
mock.module("../../../services/sessions.js", {
  namedExports: {
    getSession: (sessionId: string) => getSession(sessionId),
    createSession: async () => "unused",
    deleteSession: async () => {},
  },
});

const { default: authenticate } = await import("../../../middlewares/auth.js");

test.afterEach(() => {
  getSession = async () => null;
});

class ResponseBuilder {
  #statusCode: number | undefined;
  #responseBody: unknown;

  status(code: number) {
    this.#statusCode = code;
    return this;
  }

  json(body: unknown) {
    this.#responseBody = body;
    return this;
  }

  get statusCode() {
    return this.#statusCode;
  }

  get responseBody() {
    return this.#responseBody;
  }
}

function createRequest(cookie: Record<string, unknown> = {}): {
  cookies: Record<string, unknown>;
  user?: unknown;
} {
  return {
    cookies: cookie,
  };
}

test("returns 401 when sessionId is missing", async () => {
  const req = createRequest({});
  const res = new ResponseBuilder(); // Using Class instance

  let nextCalled = false;

  const next = () => {
    nextCalled = true;
  };

  await asMockHandler(authenticate)(req, res, next);

  assert.equal(res.statusCode, 401);

  assert.deepEqual(res.responseBody, {
    message: "Authentication required",
  });

  assert.equal(nextCalled, false);
});
test("returns 401 when session is invalid", async () => {
  getSession = async () => {
    return null;
  };

  const req = createRequest({
    sessionId: "invalid-session",
  });

  const res = new ResponseBuilder();

  let nextCalled = false;

  const next = () => {
    nextCalled = true;
  };

  try {
    await asMockHandler(authenticate)(req, res, next);

    assert.equal(res.statusCode, 401);

    assert.deepEqual(res.responseBody, {
      message: "This session is not valid",
    });

    assert.equal(nextCalled, false);
  } finally {
    // nothing to restore: test.afterEach resets getSession
  }
});
test("sets req.user and calls next when session is valid", async () => {
  const session = {
    userId: 123,
    email: "user@example.com",
    role: "Customer",
  };

  getSession = async () => {
    return session;
  };

  const req = createRequest({
    sessionId: "valid-session",
  });

  const res = new ResponseBuilder();

  let nextCalled = false;

  const next = () => {
    nextCalled = true;
  };

  try {
    await asMockHandler(authenticate)(req, res, next);

    assert.deepEqual(req.user, session);

    assert.equal(nextCalled, true);

    assert.equal(res.statusCode, undefined);

    assert.equal(res.responseBody, undefined);
  } finally {
    // nothing to restore: test.afterEach resets getSession
  }
});
test("passes session errors to next", async () => {
  const error = new Error("Redis connection failed");

  getSession = async () => {
    throw error;
  };

  const req = createRequest({
    sessionId: "session-that-causes-error",
  });

  const res = new ResponseBuilder();

  let receivedError: unknown;

  const next = (err: unknown) => {
    receivedError = err;
  };

  try {
    await asMockHandler(authenticate)(req, res, next);

    assert.equal(receivedError, error);

    assert.equal(res.statusCode, undefined);

    assert.equal(res.responseBody, undefined);
  } finally {
    // nothing to restore: test.afterEach resets getSession
  }
});
test("passes the sessionId from the cookie to getSession", async () => {
  let receivedSessionId: unknown;

  getSession = async (sessionId: string) => {
    receivedSessionId = sessionId;

    return {
      userId: 123,
    };
  };

  const req = createRequest({
    sessionId: "abc123",
  });

  const res = new ResponseBuilder();
  const next = () => {};

  try {
    await asMockHandler(authenticate)(req, res, next);

    assert.equal(receivedSessionId, "abc123");
  } finally {
    // nothing to restore: test.afterEach resets getSession
  }
});
test("stores the exact session returned by getSession in req.user", async () => {
  const session = {
    userId: 456,
    accountId: 789,
    permissions: ["product.read"],
  };

  getSession = async () => {
    return session;
  };

  const req = createRequest({
    sessionId: "valid-session",
  });

  const res = new ResponseBuilder();
  const next = () => {};

  try {
    await asMockHandler(authenticate)(req, res, next);

    assert.equal(req.user, session);
  } finally {
    // nothing to restore: test.afterEach resets getSession
  }
});
