const test = require("node:test");
const assert = require("node:assert/strict");

const { client } = require("../../../config/redis.js");

const {
  createSession,
  getSession,
  deleteSession,
} = require("../../../services/sessions.js");

test("createSession returns a session ID", async () => {
  const originalSet = client.set;

  let receivedKey;
  let receivedValue;
  let receivedOptions;

  client.set = async (key, value, options) => {
    receivedKey = key;
    receivedValue = value;
    receivedOptions = options;

    return "OK";
  };

  try {
    const sessionId = await createSession(123);

    assert.equal(typeof sessionId, "string");
    assert.equal(sessionId.length, 64);
    assert.match(sessionId, /^[a-f0-9]{64}$/);

    assert.equal(receivedKey, `session:${sessionId}`);

    assert.deepEqual(JSON.parse(receivedValue), {
      userId: 123,
    });

    assert.deepEqual(receivedOptions, {
      EX: Number(process.env.SESSION_TTL),
    });
  } finally {
    client.set = originalSet;
  }
});

test("createSession stores the correct user ID", async () => {
  const originalSet = client.set;

  let storedData;

  client.set = async (key, value) => {
    storedData = JSON.parse(value);

    return "OK";
  };

  try {
    await createSession(456);

    assert.deepEqual(storedData, {
      userId: 456,
    });
  } finally {
    client.set = originalSet;
  }
});

test("createSession generates different session IDs", async () => {
  const originalSet = client.set;

  client.set = async () => "OK";

  try {
    const firstSession = await createSession(123);
    const secondSession = await createSession(123);

    assert.notEqual(firstSession, secondSession);
  } finally {
    client.set = originalSet;
  }
});

test("createSession generates a hexadecimal session ID", async () => {
  const originalSet = client.set;

  client.set = async () => "OK";

  try {
    const sessionId = await createSession(123);

    assert.match(sessionId, /^[0-9a-f]+$/);
  } finally {
    client.set = originalSet;
  }
});

test("createSession propagates Redis errors", async () => {
  const originalSet = client.set;

  const error = new Error("Redis connection failed");

  client.set = async () => {
    throw error;
  };

  try {
    await assert.rejects(createSession(123), (receivedError) => {
      assert.equal(receivedError, error);
      return true;
    });
  } finally {
    client.set = originalSet;
  }
});

test("getSession retrieves and parses a stored session", async () => {
  const originalGet = client.get;

  let receivedKey;

  client.get = async (key) => {
    receivedKey = key;

    return JSON.stringify({
      userId: 123,
    });
  };

  try {
    const session = await getSession("abc123");

    assert.equal(receivedKey, "session:abc123");

    assert.deepEqual(session, {
      userId: 123,
    });
  } finally {
    client.get = originalGet;
  }
});

test("getSession returns null when the session does not exist", async () => {
  const originalGet = client.get;

  client.get = async () => null;

  try {
    const session = await getSession("missing-session");

    assert.equal(session, null);
  } finally {
    client.get = originalGet;
  }
});

test("getSession uses the correct Redis key", async () => {
  const originalGet = client.get;

  let receivedKey;

  client.get = async (key) => {
    receivedKey = key;

    return null;
  };

  try {
    await getSession("session-id-123");

    assert.equal(receivedKey, "session:session-id-123");
  } finally {
    client.get = originalGet;
  }
});

test("getSession returns the complete stored session object", async () => {
  const originalGet = client.get;

  const storedSession = {
    userId: 789,
    role: "manager",
  };

  client.get = async () => {
    return JSON.stringify(storedSession);
  };

  try {
    const session = await getSession("session-id");

    assert.deepEqual(session, storedSession);
  } finally {
    client.get = originalGet;
  }
});

test("getSession parses JSON returned by Redis", async () => {
  const originalGet = client.get;

  client.get = async () => {
    return JSON.stringify({
      userId: 42,
    });
  };

  try {
    const session = await getSession("session-id");

    assert.equal(session.userId, 42);
    assert.equal(typeof session, "object");
  } finally {
    client.get = originalGet;
  }
});

test("getSession propagates Redis errors", async () => {
  const originalGet = client.get;

  const error = new Error("Redis unavailable");

  client.get = async () => {
    throw error;
  };

  try {
    await assert.rejects(getSession("session-id"), (receivedError) => {
      assert.equal(receivedError, error);
      return true;
    });
  } finally {
    client.get = originalGet;
  }
});

test("getSession propagates invalid JSON errors", async () => {
  const originalGet = client.get;

  client.get = async () => {
    return "not valid JSON";
  };

  try {
    await assert.rejects(getSession("session-id"), SyntaxError);
  } finally {
    client.get = originalGet;
  }
});

test("deleteSession deletes the correct Redis key", async () => {
  const originalDel = client.del;

  let receivedKey;

  client.del = async (key) => {
    receivedKey = key;

    return 1;
  };

  try {
    await deleteSession("abc123");

    assert.equal(receivedKey, "session:abc123");
  } finally {
    client.del = originalDel;
  }
});

test("deleteSession resolves when Redis deletion succeeds", async () => {
  const originalDel = client.del;

  client.del = async () => 1;

  try {
    await assert.doesNotReject(deleteSession("session-id"));
  } finally {
    client.del = originalDel;
  }
});

test("deleteSession resolves even when Redis reports that no key was deleted", async () => {
  const originalDel = client.del;

  client.del = async () => 0;

  try {
    await assert.doesNotReject(deleteSession("missing-session"));
  } finally {
    client.del = originalDel;
  }
});

test("deleteSession propagates Redis errors", async () => {
  const originalDel = client.del;

  const error = new Error("Redis deletion failed");

  client.del = async () => {
    throw error;
  };

  try {
    await assert.rejects(deleteSession("session-id"), (receivedError) => {
      assert.equal(receivedError, error);
      return true;
    });
  } finally {
    client.del = originalDel;
  }
});
