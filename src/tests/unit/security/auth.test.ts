import test, { mock } from "node:test";
import assert from "node:assert/strict";

import { asMockHandler } from "../../helpers.js";

type SqlCall = { sql: string; parameters: unknown[] | undefined };

type Transaction = {
  queries: SqlCall[];
  released: boolean;
  query(sql: string, parameters?: unknown[]): Promise<{ rows: any[] }>;
  release(): void;
};

type Next = {
  (...args: unknown[]): void;
  called: boolean;
  args: unknown[];
};

const makeResponse = () => {
  const response = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    cookieCalls: [] as { name: string; value: string; options: unknown }[],
    clearCookieCalls: [] as { name: string; options: unknown }[],
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(body: unknown) {
      response.body = body;
      return response;
    },
    cookie(name: string, value: string, options: unknown) {
      response.cookieCalls.push({ name, value, options });
      return response;
    },
    clearCookie(name: string, options: unknown) {
      response.clearCookieCalls.push({ name, options });
      return response;
    },
  };

  return response;
};

const makeNext = () => {
  const next = ((...args: unknown[]) => {
    next.called = true;
    next.args = args;
  }) as Next;

  next.called = false;
  next.args = [];

  return next;
};

const makeTransaction = (): Transaction => ({
  queries: [],
  released: false,

  async query(sql: string, parameters?: unknown[]) {
    this.queries.push({ sql, parameters });
    return { rows: [] };
  },

  release() {
    this.released = true;
  },
});

const createEnvironment = () => {
  const state = {
    pgQueries: [] as SqlCall[],
    transactionQueries: [] as SqlCall[],
    pgQueryHandler: null as
      | ((sql: string, parameters?: unknown[]) => Promise<any>)
      | null,
    transactionQueryHandler: null as
      | ((
          sql: string,
          parameters: unknown[] | undefined,
          transaction: Transaction,
        ) => Promise<any>)
      | null,

    connectError: null as Error | null,

    hashPasswordCalls: [] as unknown[],
    verifyPasswordCalls: [] as { storedHash: string; password: string }[],
    createSessionCalls: [] as unknown[],
    deleteSessionCalls: [] as unknown[],

    generateTokenCalls: 0,
    hashTokenCalls: [] as unknown[],

    emailCalls: [] as { email: string; token: string }[],

    generatedToken: "raw-verification-token",
    hashedToken: "hashed-verification-token",
    passwordHash: "hashed-password",
    passwordValid: true,
    sessionId: "session-abc",

    transaction: null as Transaction | null,
  };

  const pg = {
    async query(sql: string, parameters?: unknown[]) {
      state.pgQueries.push({ sql, parameters });

      if (state.pgQueryHandler) {
        return state.pgQueryHandler(sql, parameters);
      }

      return { rows: [] };
    },

    async connect() {
      if (state.connectError) {
        throw state.connectError;
      }

      const transaction = makeTransaction();

      const originalQuery = transaction.query.bind(transaction);

      transaction.query = async (sql: string, parameters?: unknown[]) => {
        state.transactionQueries.push({ sql, parameters });

        if (state.transactionQueryHandler) {
          return state.transactionQueryHandler(sql, parameters, transaction);
        }

        return originalQuery(sql, parameters);
      };

      state.transaction = transaction;

      return transaction;
    },
  };

  const passwordHashing = {
    async hashPassword(password: string) {
      state.hashPasswordCalls.push(password);
      return state.passwordHash;
    },

    async verifyPassword(storedHash: string, password: string) {
      state.verifyPasswordCalls.push({
        storedHash,
        password,
      });

      return state.passwordValid;
    },
  };

  const sessions = {
    async createSession(accountId: number) {
      state.createSessionCalls.push(accountId);
      return state.sessionId;
    },

    async deleteSession(sessionId: string) {
      state.deleteSessionCalls.push(sessionId);
    },
  };

  const verificationToken = {
    generateVerificationToken() {
      state.generateTokenCalls += 1;
      return state.generatedToken;
    },

    hashVerificationToken(token: string) {
      state.hashTokenCalls.push(token);
      return state.hashedToken;
    },
  };

  const sendVerificationEmail = async (email: string, token: string) => {
    state.emailCalls.push({ email, token });
  };

  return {
    state,
    pg,
    passwordHashing,
    sessions,
    verificationToken,
    sendVerificationEmail,
  };
};

type Environment = ReturnType<typeof createEnvironment>;

let loadCount = 0;

// security/auth.ts imports its collaborators with ES module imports, so they are
// replaced with mock.module() and the module is imported again (the ?load=
// query makes Node evaluate it fresh) so it picks up this environment.
const loadAuth = async (environment: Environment) => {
  const mocks = [
    mock.module("../../../config/db.js", {
      defaultExport: environment.pg,
    }),
    mock.module("../../../services/verification-token.js", {
      namedExports: environment.verificationToken,
    }),
    mock.module("../../../services/email.js", {
      defaultExport: environment.sendVerificationEmail,
    }),
    mock.module("../../../services/password-hashing.js", {
      namedExports: environment.passwordHashing,
    }),
    mock.module("../../../services/sessions.js", {
      namedExports: environment.sessions,
    }),
  ];

  try {
    loadCount += 1;

    return await import(`../../../security/auth.js?load=${loadCount}`);
  } finally {
    for (const mocked of mocks) {
      mocked.restore();
    }
  }
};

const withEnvironment = async (callback: () => Promise<void>) => {
  const originalCustomerId = process.env.CUSTOMER_ID;
  const originalCookieSecure = process.env.COOKIE_SECURE;

  process.env.CUSTOMER_ID = "7";
  process.env.COOKIE_SECURE = "false";

  try {
    return await callback();
  } finally {
    if (originalCustomerId === undefined) {
      delete process.env.CUSTOMER_ID;
    } else {
      process.env.CUSTOMER_ID = originalCustomerId;
    }

    if (originalCookieSecure === undefined) {
      delete process.env.COOKIE_SECURE;
    } else {
      process.env.COOKIE_SECURE = originalCookieSecure;
    }
  }
};

test("register trims user input before database queries", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    let transactionStep = 0;

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      transactionStep += 1;

      if (sql.includes("INSERT INTO customers")) {
        return { rows: [{ id: 55 }] };
      }

      if (sql.includes("INSERT INTO accounts")) {
        return { rows: [{ account_id: 91 }] };
      }

      return { rows: [] };
    };

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "  John Smith  ",
        username: "  johnsmith  ",
        email: "  john@example.com  ",
        password: "password123",
        shipping_address: "  Riyadh Street  ",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    assert.equal(next.called, false);
    assert.equal(res.statusCode, 201);

    assert.deepEqual(environment.state.pgQueries[0]!.parameters, [
      "johnsmith",
      "john@example.com",
    ]);

    const customerQuery = environment.state.transactionQueries.find((query: any) =>
      query.sql.includes("INSERT INTO customers"),
    );

    assert.deepEqual(customerQuery!.parameters, [
      "John Smith",
      "john@example.com",
      "Riyadh Street",
    ]);

    assert.equal(transactionStep >= 6, true);
  });
});

test("register returns 409 when username or email already exists", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [{ account_id: 10 }],
    });

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "john@example.com",
        password: "password123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
      message: "Username or email already exists",
    });

    assert.equal(environment.state.transaction, null);
    assert.equal(next.called, false);
  });
});

test("register hashes the supplied password", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("INSERT INTO customers")) {
        return { rows: [{ id: 20 }] };
      }

      if (sql.includes("INSERT INTO accounts")) {
        return { rows: [{ account_id: 30 }] };
      }

      return { rows: [] };
    };

    environment.state.passwordHash = "argon2-test-hash";

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "john@example.com",
        password: "SuperSecret123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    assert.deepEqual(environment.state.hashPasswordCalls, ["SuperSecret123"]);

    const accountQuery = environment.state.transactionQueries.find((query: any) =>
      query.sql.includes("INSERT INTO accounts"),
    );

    assert.equal(accountQuery!.parameters![3], "argon2-test-hash");
  });
});

test("register inserts the customer and uses the returned customer ID", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("INSERT INTO customers")) {
        return { rows: [{ id: 123 }] };
      }

      if (sql.includes("INSERT INTO accounts")) {
        return { rows: [{ account_id: 456 }] };
      }

      return { rows: [] };
    };

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "john@example.com",
        password: "password123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    const accountQuery = environment.state.transactionQueries.find((query: any) =>
      query.sql.includes("INSERT INTO accounts"),
    );

    assert.equal(accountQuery!.parameters![0], 123);
  });
});

test("register assigns the customer role to the newly created account", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("INSERT INTO customers")) {
        return { rows: [{ id: 100 }] };
      }

      if (sql.includes("INSERT INTO accounts")) {
        return { rows: [{ account_id: 200 }] };
      }

      return { rows: [] };
    };

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "john@example.com",
        password: "password123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    const roleQuery = environment.state.transactionQueries.find((query: any) =>
      query.sql.includes("INSERT INTO account_roles"),
    );

    assert.deepEqual(roleQuery!.parameters, [200, 7]);
  });
});

test("register generates and hashes a verification token", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("INSERT INTO customers")) {
        return { rows: [{ id: 1 }] };
      }

      if (sql.includes("INSERT INTO accounts")) {
        return { rows: [{ account_id: 2 }] };
      }

      return { rows: [] };
    };

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "john@example.com",
        password: "password123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    assert.equal(environment.state.generateTokenCalls, 1);
    assert.deepEqual(environment.state.hashTokenCalls, [
      "raw-verification-token",
    ]);
  });
});

test("register stores the hashed verification token", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("INSERT INTO customers")) {
        return { rows: [{ id: 10 }] };
      }

      if (sql.includes("INSERT INTO accounts")) {
        return { rows: [{ account_id: 20 }] };
      }

      return { rows: [] };
    };

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "john@example.com",
        password: "password123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    const tokenQuery = environment.state.transactionQueries.find((query: any) =>
      query.sql.includes("INSERT INTO account_verification_tokens"),
    );

    assert.deepEqual(tokenQuery!.parameters!.slice(0, 2), [
      20,
      "hashed-verification-token",
    ]);
  });
});

test("register commits before sending the verification email", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("INSERT INTO customers")) {
        return { rows: [{ id: 10 }] };
      }

      if (sql.includes("INSERT INTO accounts")) {
        return { rows: [{ account_id: 20 }] };
      }

      return { rows: [] };
    };

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "john@example.com",
        password: "password123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    const commitIndex = environment.state.transactionQueries.findIndex(
      (query: any) => query.sql === "COMMIT",
    );

    assert.equal(commitIndex >= 0, true);
    assert.equal(environment.state.emailCalls.length, 1);
  });
});

test("register sends the cleaned email and raw verification token", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("INSERT INTO customers")) {
        return { rows: [{ id: 10 }] };
      }

      if (sql.includes("INSERT INTO accounts")) {
        return { rows: [{ account_id: 20 }] };
      }

      return { rows: [] };
    };

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "  john@example.com  ",
        password: "password123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    assert.deepEqual(environment.state.emailCalls, [
      {
        email: "john@example.com",
        token: "raw-verification-token",
      },
    ]);
  });
});

test("register returns 201 after successful account creation", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("INSERT INTO customers")) {
        return { rows: [{ id: 1 }] };
      }

      if (sql.includes("INSERT INTO accounts")) {
        return { rows: [{ account_id: 2 }] };
      }

      return { rows: [] };
    };

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "john@example.com",
        password: "password123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      message: "Account created successfully",
    });

    assert.equal(environment.state.transaction!.released, true);
  });
});

test("register rolls back when a transaction query fails", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();
    const databaseError = new Error("Database failure");

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql === "BEGIN") {
        return { rows: [] };
      }

      if (sql.includes("INSERT INTO customers")) {
        throw databaseError;
      }

      if (sql === "ROLLBACK") {
        return { rows: [] };
      }

      return { rows: [] };
    };

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "john@example.com",
        password: "password123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    assert.equal(next.called, true);
    assert.equal(next.args[0], databaseError);

    assert.equal(
      environment.state.transactionQueries.some(
        (query: any) => query.sql === "ROLLBACK",
      ),
      true,
    );

    assert.equal(environment.state.transaction!.released, true);
  });
});

test("register passes rollback failures to next", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();
    const originalError = new Error("Original database error");
    const rollbackError = new Error("Rollback failed");

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("INSERT INTO customers")) {
        throw originalError;
      }

      if (sql === "ROLLBACK") {
        throw rollbackError;
      }

      return { rows: [] };
    };

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "john@example.com",
        password: "password123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    assert.equal(next.called, true);
    assert.equal(next.args[0], rollbackError);
  });
});

test("register passes verification email errors to next", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();
    const emailError = new Error("Email service failed");

    environment.sendVerificationEmail = async () => {
      throw emailError;
    };

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("INSERT INTO customers")) {
        return { rows: [{ id: 1 }] };
      }

      if (sql.includes("INSERT INTO accounts")) {
        return { rows: [{ account_id: 2 }] };
      }

      return { rows: [] };
    };

    const { register } = await loadAuth(environment);

    const req = {
      body: {
        customer_name: "John",
        username: "john",
        email: "john@example.com",
        password: "password123",
        shipping_address: "Riyadh",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(register)(req, res, next);

    assert.equal(next.called, true);
    assert.equal(next.args[0], emailError);

    assert.equal(
      environment.state.transactionQueries.some(
        (query: any) => query.sql === "COMMIT",
      ),
      true,
    );

    assert.equal(environment.state.transaction!.released, true);
  });
});

test("verifyAccount hashes the supplied verification token", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    const { verifyAccount } = await loadAuth(environment);

    const req = {
      query: {
        token: "raw-token",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(verifyAccount)(req, res, next);

    assert.deepEqual(environment.state.hashTokenCalls, ["raw-token"]);
  });
});

test("verifyAccount returns 400 for an invalid token", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    const { verifyAccount } = await loadAuth(environment);

    const req = {
      query: {
        token: "invalid-token",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(verifyAccount)(req, res, next);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      message: "Invalid verification token",
    });

    assert.equal(next.called, false);
  });
});

test("verifyAccount returns 400 when the verification token has expired", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          token_id: 10,
          account_id: 20,
          expires_at: new Date(Date.now() - 1000),
        },
      ],
    });

    const { verifyAccount } = await loadAuth(environment);

    const req = {
      query: {
        token: "expired-token",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(verifyAccount)(req, res, next);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      message: "Verification token has expired",
    });

    assert.equal(environment.state.transaction, null);
  });
});

test("verifyAccount activates the account and deletes the verification token", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          token_id: 10,
          account_id: 20,
          expires_at: new Date(Date.now() + 60_000),
        },
      ],
    });

    const { verifyAccount } = await loadAuth(environment);

    const req = {
      query: {
        token: "valid-token",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(verifyAccount)(req, res, next);

    const updateQuery = environment.state.transactionQueries.find((query: any) =>
      query.sql.includes("UPDATE accounts"),
    );

    const deleteQuery = environment.state.transactionQueries.find((query: any) =>
      query.sql.includes("DELETE FROM account_verification_tokens"),
    );

    assert.deepEqual(updateQuery!.parameters, [20]);
    assert.deepEqual(deleteQuery!.parameters, [10]);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      message: "Account verified successfully",
    });
  });
});

test("verifyAccount commits the transaction on success", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          token_id: 10,
          account_id: 20,
          expires_at: new Date(Date.now() + 60_000),
        },
      ],
    });

    const { verifyAccount } = await loadAuth(environment);

    const req = {
      query: {
        token: "valid-token",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(verifyAccount)(req, res, next);

    assert.equal(
      environment.state.transactionQueries.some(
        (query: any) => query.sql === "BEGIN",
      ),
      true,
    );

    assert.equal(
      environment.state.transactionQueries.some(
        (query: any) => query.sql === "COMMIT",
      ),
      true,
    );

    assert.equal(environment.state.transaction!.released, true);
  });
});

test("verifyAccount rolls back when account activation fails", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();
    const databaseError = new Error("Activation failed");

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          token_id: 10,
          account_id: 20,
          expires_at: new Date(Date.now() + 60_000),
        },
      ],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("UPDATE accounts")) {
        throw databaseError;
      }

      return { rows: [] };
    };

    const { verifyAccount } = await loadAuth(environment);

    const req = {
      query: {
        token: "valid-token",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(verifyAccount)(req, res, next);

    assert.equal(next.called, true);
    assert.equal(next.args[0], databaseError);

    assert.equal(
      environment.state.transactionQueries.some(
        (query: any) => query.sql === "ROLLBACK",
      ),
      true,
    );

    assert.equal(environment.state.transaction!.released, true);
  });
});

test("verifyAccount passes rollback errors to next", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    const originalError = new Error("Update failed");
    const rollbackError = new Error("Rollback failed");

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          token_id: 10,
          account_id: 20,
          expires_at: new Date(Date.now() + 60_000),
        },
      ],
    });

    environment.state.transactionQueryHandler = async (sql: string) => {
      if (sql.includes("UPDATE accounts")) {
        throw originalError;
      }

      if (sql === "ROLLBACK") {
        throw rollbackError;
      }

      return { rows: [] };
    };

    const { verifyAccount } = await loadAuth(environment);

    const req = {
      query: {
        token: "valid-token",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(verifyAccount)(req, res, next);

    assert.equal(next.called, true);
    assert.equal(next.args[0], rollbackError);
  });
});

test("login trims the email before querying the database", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    const { login } = await loadAuth(environment);

    const req = {
      body: {
        email: "  john@example.com  ",
        password: "password123",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(login)(req, res, next);

    assert.deepEqual(environment.state.pgQueries[0]!.parameters, [
      "john@example.com",
    ]);
  });
});

test("login returns 401 when the account does not exist", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [],
    });

    const { login } = await loadAuth(environment);

    const req = {
      body: {
        email: "missing@example.com",
        password: "password123",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(login)(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
      message: "Incorrect email or password",
    });

    assert.equal(environment.state.verifyPasswordCalls.length, 0);
  });
});

test("login verifies the supplied password against the stored hash", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          account_id: 42,
          email: "john@example.com",
          password_hash: "stored-hash",
          status: "active",
        },
      ],
    });

    environment.state.passwordValid = true;

    const { login } = await loadAuth(environment);

    const req = {
      body: {
        email: "john@example.com",
        password: "password123",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(login)(req, res, next);

    assert.deepEqual(environment.state.verifyPasswordCalls, [
      {
        storedHash: "stored-hash",
        password: "password123",
      },
    ]);
  });
});

test("login returns 401 when the password is incorrect", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          account_id: 42,
          email: "john@example.com",
          password_hash: "stored-hash",
          status: "active",
        },
      ],
    });

    environment.state.passwordValid = false;

    const { login } = await loadAuth(environment);

    const req = {
      body: {
        email: "john@example.com",
        password: "wrong-password",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(login)(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
      message: "Incorrect email or password",
    });

    assert.equal(environment.state.createSessionCalls.length, 0);
  });
});

test("login rejects an inactive account", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          account_id: 42,
          email: "john@example.com",
          password_hash: "stored-hash",
          status: "pending",
        },
      ],
    });

    environment.state.passwordValid = true;

    const { login } = await loadAuth(environment);

    const req = {
      body: {
        email: "john@example.com",
        password: "password123",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(login)(req, res, next);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
      message: "Account is not active",
    });

    assert.equal(environment.state.createSessionCalls.length, 0);
  });
});

test("login creates a session using the account ID", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          account_id: 77,
          email: "john@example.com",
          password_hash: "stored-hash",
          status: "active",
        },
      ],
    });

    environment.state.passwordValid = true;

    const { login } = await loadAuth(environment);

    const req = {
      body: {
        email: "john@example.com",
        password: "password123",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(login)(req, res, next);

    assert.deepEqual(environment.state.createSessionCalls, [77]);
  });
});

test("login sets the session cookie with the returned session ID", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          account_id: 77,
          email: "john@example.com",
          password_hash: "stored-hash",
          status: "active",
        },
      ],
    });

    environment.state.sessionId = "session-from-service";

    const { login } = await loadAuth(environment);

    const req = {
      body: {
        email: "john@example.com",
        password: "password123",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(login)(req, res, next);

    assert.deepEqual(res.cookieCalls, [
      {
        name: "sessionId",
        value: "session-from-service",
        options: {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 24 * 60 * 60 * 1000,
        },
      },
    ]);
  });
});

test("login returns 200 after successful authentication", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          account_id: 77,
          email: "john@example.com",
          password_hash: "stored-hash",
          status: "active",
        },
      ],
    });

    const { login } = await loadAuth(environment);

    const req = {
      body: {
        email: "john@example.com",
        password: "password123",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(login)(req, res, next);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      message: "Account logged in",
    });
  });
});

test("login uses secure cookies when COOKIE_SECURE is true", async () => {
  await withEnvironment(async () => {
    process.env.COOKIE_SECURE = "true";

    const environment = createEnvironment();

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          account_id: 77,
          email: "john@example.com",
          password_hash: "stored-hash",
          status: "active",
        },
      ],
    });

    const { login } = await loadAuth(environment);

    const req = {
      body: {
        email: "john@example.com",
        password: "password123",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(login)(req, res, next);

    assert.equal((res.cookieCalls[0]!.options as { secure: boolean }).secure, true);
  });
});

test("login passes session creation errors to next", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();
    const sessionError = new Error("Session creation failed");

    environment.state.pgQueryHandler = async () => ({
      rows: [
        {
          account_id: 77,
          email: "john@example.com",
          password_hash: "stored-hash",
          status: "active",
        },
      ],
    });

    environment.sessions.createSession = async () => {
      throw sessionError;
    };

    const { login } = await loadAuth(environment);

    const req = {
      body: {
        email: "john@example.com",
        password: "password123",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(login)(req, res, next);

    assert.equal(next.called, true);
    assert.equal(next.args[0], sessionError);
  });
});

test("logout returns 401 when no session cookie exists", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    const { logout } = await loadAuth(environment);

    const req = {
      cookies: {},
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(logout)(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
      message: "You are not logged in",
    });

    assert.equal(environment.state.deleteSessionCalls.length, 0);
  });
});

test("logout deletes the session identified by the cookie", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    const { logout } = await loadAuth(environment);

    const req = {
      cookies: {
        sessionId: "session-to-delete",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(logout)(req, res, next);

    assert.deepEqual(environment.state.deleteSessionCalls, [
      "session-to-delete",
    ]);
  });
});

test("logout clears the session cookie", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    const { logout } = await loadAuth(environment);

    const req = {
      cookies: {
        sessionId: "session-to-delete",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(logout)(req, res, next);

    assert.deepEqual(res.clearCookieCalls, [
      {
        name: "sessionId",
        options: {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        },
      },
    ]);
  });
});

test("logout returns 200 after deleting the session", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();

    const { logout } = await loadAuth(environment);

    const req = {
      cookies: {
        sessionId: "session-to-delete",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(logout)(req, res, next);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      message: "Account logged out",
    });
  });
});

test("logout passes session deletion errors to next", async () => {
  await withEnvironment(async () => {
    const environment = createEnvironment();
    const deleteError = new Error("Session deletion failed");

    environment.sessions.deleteSession = async () => {
      throw deleteError;
    };

    const { logout } = await loadAuth(environment);

    const req = {
      cookies: {
        sessionId: "session-to-delete",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(logout)(req, res, next);

    assert.equal(next.called, true);
    assert.equal(next.args[0], deleteError);

    assert.equal(res.clearCookieCalls.length, 0);
  });
});

test("logout uses secure cookie clearing when COOKIE_SECURE is true", async () => {
  await withEnvironment(async () => {
    process.env.COOKIE_SECURE = "true";

    const environment = createEnvironment();

    const { logout } = await loadAuth(environment);

    const req = {
      cookies: {
        sessionId: "session-to-delete",
      },
    };

    const res = makeResponse();
    const next = makeNext();

    await asMockHandler(logout)(req, res, next);

    assert.equal((res.clearCookieCalls[0]!.options as { secure: boolean }).secure, true);
  });
});
