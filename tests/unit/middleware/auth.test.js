const test = require("node:test");
const assert = require("node:assert/strict");

const sessions = require("../../../services/sessions.js");
const authenticate = require("../../../middlewares/auth.js");

class ResponseBuilder {
  #statusCode;
  #responseBody;

  status(code) {
    this.#statusCode = code;
    return this;
  }

  json(body) {
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

function createRequest(cookie = {}) {
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

  await authenticate(req, res, next);

  assert.equal(res.statusCode, 401);

  assert.deepEqual(res.responseBody, {
    message: "Authentication required",
  });

  assert.equal(nextCalled, false);
});
test("returns 401 when session is invalid", async () => {
  const originalGetSession = sessions.getSession;

  sessions.getSession = async () => {
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
    await authenticate(req, res, next);

    assert.equal(res.statusCode, 401);

    assert.deepEqual(res.responseBody, {
      message: "This session is not valid",
    });

    assert.equal(nextCalled, false);
  } finally {
    sessions.getSession = originalGetSession;
  }
});
test("sets req.user and calls next when session is valid", async () => {
  const originalGetSession = sessions.getSession;

  const session = {
    userId: 123,
    email: "user@example.com",
    role: "Customer",
  };

  sessions.getSession = async () => {
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
    await authenticate(req, res, next);

    assert.deepEqual(req.user, session);

    assert.equal(nextCalled, true);

    assert.equal(res.statusCode, undefined);

    assert.equal(res.responseBody, undefined);
  } finally {
    sessions.getSession = originalGetSession;
  }
});
test("passes session errors to next", async () => {
  const originalGetSession = sessions.getSession;

  const error = new Error("Redis connection failed");

  sessions.getSession = async () => {
    throw error;
  };

  const req = createRequest({
    sessionId: "session-that-causes-error",
  });

  const res = new ResponseBuilder();

  let receivedError;

  const next = (err) => {
    receivedError = err;
  };

  try {
    await authenticate(req, res, next);

    assert.equal(receivedError, error);

    assert.equal(res.statusCode, undefined);

    assert.equal(res.responseBody, undefined);
  } finally {
    sessions.getSession = originalGetSession;
  }
});
test("passes the sessionId from the cookie to getSession", async () => {
  const originalGetSession = sessions.getSession;

  let receivedSessionId;

  sessions.getSession = async (sessionId) => {
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
    await authenticate(req, res, next);

    assert.equal(receivedSessionId, "abc123");
  } finally {
    sessions.getSession = originalGetSession;
  }
});
test("stores the exact session returned by getSession in req.user", async () => {
  const originalGetSession = sessions.getSession;

  const session = {
    userId: 456,
    accountId: 789,
    permissions: ["product.read"],
  };

  sessions.getSession = async () => {
    return session;
  };

  const req = createRequest({
    sessionId: "valid-session",
  });

  const res = new ResponseBuilder();
  const next = () => {};

  try {
    await authenticate(req, res, next);

    assert.equal(req.user, session);
  } finally {
    sessions.getSession = originalGetSession;
  }
});
//
