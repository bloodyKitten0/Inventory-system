import test from "node:test";
import assert from "node:assert/strict";

import { client } from "../../../config/redis.js";

import {
  createSession,
  getSession,
  deleteSession,
} from "../../../services/sessions.js";

const redis = client as unknown as {
  get: unknown;
  set: unknown;
  del: unknown;
};

test("createSession returns a session ID", async () => {
  const originalSet = redis.set;

  let receivedKey: any;
  let receivedValue: any;
  let receivedOptions: any;

  redis.set = async (key: string, value: unknown, options: unknown) => {
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
    redis.set = originalSet;
  }
});

test("createSession stores the correct user ID", async () => {
  const originalSet = redis.set;

  let storedData: any;

  redis.set = async (key: string, value: string) => {
    storedData = JSON.parse(value);

    return "OK";
  };

  try {
    await createSession(456);

    assert.deepEqual(storedData, {
      userId: 456,
    });
  } finally {
    redis.set = originalSet;
  }
});

test("createSession generates different session IDs", async () => {
  const originalSet = redis.set;

  redis.set = async () => "OK";

  try {
    const firstSession = await createSession(123);
    const secondSession = await createSession(123);

    assert.notEqual(firstSession, secondSession);
  } finally {
    redis.set = originalSet;
  }
});

test("createSession generates a hexadecimal session ID", async () => {
  const originalSet = redis.set;

  redis.set = async () => "OK";

  try {
    const sessionId = await createSession(123);

    assert.match(sessionId, /^[0-9a-f]+$/);
  } finally {
    redis.set = originalSet;
  }
});

test("createSession propagates Redis errors", async () => {
  const originalSet = redis.set;

  const error = new Error("Redis connection failed");

  redis.set = async () => {
    throw error;
  };

  try {
    await assert.rejects(createSession(123), (receivedError) => {
      assert.equal(receivedError, error);
      return true;
    });
  } finally {
    redis.set = originalSet;
  }
});

test("getSession retrieves and parses a stored session", async () => {
  const originalGet = redis.get;

  let receivedKey: any;

  redis.get = async (key: string) => {
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
    redis.get = originalGet;
  }
});

test("getSession returns null when the session does not exist", async () => {
  const originalGet = redis.get;

  redis.get = async () => null;

  try {
    const session = await getSession("missing-session");

    assert.equal(session, null);
  } finally {
    redis.get = originalGet;
  }
});

test("getSession uses the correct Redis key", async () => {
  const originalGet = redis.get;

  let receivedKey: any;

  redis.get = async (key: string) => {
    receivedKey = key;

    return null;
  };

  try {
    await getSession("session-id-123");

    assert.equal(receivedKey, "session:session-id-123");
  } finally {
    redis.get = originalGet;
  }
});

test("getSession returns the complete stored session object", async () => {
  const originalGet = redis.get;

  const storedSession = {
    userId: 789,
    role: "manager",
  };

  redis.get = async () => {
    return JSON.stringify(storedSession);
  };

  try {
    const session = await getSession("session-id");

    assert.deepEqual(session, storedSession);
  } finally {
    redis.get = originalGet;
  }
});

test("getSession parses JSON returned by Redis", async () => {
  const originalGet = redis.get;

  redis.get = async () => {
    return JSON.stringify({
      userId: 42,
    });
  };

  try {
    const session = await getSession("session-id");

    assert.equal(session!.userId, 42);
    assert.equal(typeof session, "object");
  } finally {
    redis.get = originalGet;
  }
});

test("getSession propagates Redis errors", async () => {
  const originalGet = redis.get;

  const error = new Error("Redis unavailable");

  redis.get = async () => {
    throw error;
  };

  try {
    await assert.rejects(getSession("session-id"), (receivedError) => {
      assert.equal(receivedError, error);
      return true;
    });
  } finally {
    redis.get = originalGet;
  }
});

test("getSession propagates invalid JSON errors", async () => {
  const originalGet = redis.get;

  redis.get = async () => {
    return "not valid JSON";
  };

  try {
    await assert.rejects(getSession("session-id"), SyntaxError);
  } finally {
    redis.get = originalGet;
  }
});

test("deleteSession deletes the correct Redis key", async () => {
  const originalDel = redis.del;

  let receivedKey: any;

  redis.del = async (key: string) => {
    receivedKey = key;

    return 1;
  };

  try {
    await deleteSession("abc123");

    assert.equal(receivedKey, "session:abc123");
  } finally {
    redis.del = originalDel;
  }
});

test("deleteSession resolves when Redis deletion succeeds", async () => {
  const originalDel = redis.del;

  redis.del = async () => 1;

  try {
    await assert.doesNotReject(deleteSession("session-id"));
  } finally {
    redis.del = originalDel;
  }
});

test("deleteSession resolves even when Redis reports that no key was deleted", async () => {
  const originalDel = redis.del;

  redis.del = async () => 0;

  try {
    await assert.doesNotReject(deleteSession("missing-session"));
  } finally {
    redis.del = originalDel;
  }
});

test("deleteSession propagates Redis errors", async () => {
  const originalDel = redis.del;

  const error = new Error("Redis deletion failed");

  redis.del = async () => {
    throw error;
  };

  try {
    await assert.rejects(deleteSession("session-id"), (receivedError) => {
      assert.equal(receivedError, error);
      return true;
    });
  } finally {
    redis.del = originalDel;
  }
});
