import pg from "../config/db.js";
import {
  generateVerificationToken,
  hashVerificationToken,
} from "../services/verification-token.js";

import test from "../services/try-catch.js";
import sendVerificationEmail from "../services/email.js";
import {
  hashPassword,
  verifyPassword,
} from "../services/password-hashing.js";
import { createSession, deleteSession, SESSION_TTL } from "../services/sessions.js";
const getCustomerRoleId = async (client?: any): Promise<number> => {
  const envId = Number(process.env.CUSTOMER_ID);
  if (Number.isInteger(envId) && envId > 0) {
    return envId;
  }
  const db = client || pg;
  try {
    const res = await db.query(
      `SELECT role_id FROM roles WHERE LOWER(name) = 'customer' LIMIT 1`,
    );
    if (res.rows.length > 0 && res.rows[0].role_id) {
      return Number(res.rows[0].role_id);
    }
  } catch {
    // fallback
  }
  return 8;
};

const register = test(async (req, res) => {
  const { customer_name, username, email, password, shipping_address } =
    req.body;

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanCustomerName = customer_name.trim();
  const cleanShippingAddress = shipping_address.trim();

  const existingAccount = await pg.query(
    `SELECT account_id
     FROM accounts
     WHERE username = $1 OR email = $2`,
    [cleanUsername, cleanEmail],
  );

  if (existingAccount.rows.length > 0) {
    return res
      .status(409)
      .json({ message: "Username or email already exists" });
  }

  const transaction = await pg.connect();

  try {
    await transaction.query("BEGIN");

    const customer = await transaction.query(
      `
      INSERT INTO customers
        (customer_name, customer_email, shipping_address, created_at)
      VALUES
        ($1, $2, $3, now())
      RETURNING id
      `,
      [cleanCustomerName, cleanEmail, cleanShippingAddress],
    );

    const passwordHash = await hashPassword(password);

    const account = await transaction.query(
      `
      INSERT INTO accounts
        (customer_id, username, email, password_hash, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, now(), now())
      RETURNING account_id
      `,
      [customer.rows[0].id, cleanUsername, cleanEmail, passwordHash],
    );

    const customerRoleId = await getCustomerRoleId(transaction);

    await transaction.query(
      `
      INSERT INTO account_roles
        (account_id, role_id)
      VALUES
        ($1, $2)
      `,
      [account.rows[0].account_id, customerRoleId],
    );

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const rawToken = generateVerificationToken();
    const hashedToken = hashVerificationToken(rawToken);

    await transaction.query(
      `
      INSERT INTO account_verification_tokens
        (account_id, token_hash, expires_at, created_at)
      VALUES
        ($1, $2, $3, now())
      `,
      [account.rows[0].account_id, hashedToken, expiresAt],
    );

    await sendVerificationEmail(cleanEmail, rawToken);

    await transaction.query("COMMIT");

    return res.status(201).json({
      message: "Account created successfully",
    });
  } catch (error) {
    await transaction.query("ROLLBACK");
    throw error;
  } finally {
    transaction.release();
  }
});

const verifyAccount = test(async (req, res) => {
  const token = req.query.token as string;

  const hashedToken = hashVerificationToken(token);

  const checkToken = await pg.query(
    `
    SELECT token_id, account_id, expires_at
    FROM account_verification_tokens
    WHERE token_hash = $1
    `,
    [hashedToken],
  );

  if (checkToken.rows.length === 0) {
    return res.status(400).json({
      message: "Invalid verification token",
    });
  }

  const accountId = checkToken.rows[0].account_id;
  const expiresAt = checkToken.rows[0].expires_at;
  const tokenId = checkToken.rows[0].token_id;

  if (new Date() >= expiresAt) {
    return res.status(400).json({
      message: "Verification token has expired",
    });
  }

  const transaction = await pg.connect();

  try {
    await transaction.query("BEGIN");

    const claimToken = await transaction.query(
      `
      SELECT token_id, account_id, expires_at
      FROM account_verification_tokens
      WHERE token_id = $1
      FOR UPDATE
      `,
      [tokenId],
    );

    if (claimToken.rowCount === 0) {
      await transaction.query("ROLLBACK");
      return res.status(400).json({
        message: "Invalid verification token",
      });
    }

    await transaction.query(
      `
      UPDATE accounts
      SET status = 'active'
      WHERE account_id = $1
      `,
      [accountId],
    );

    const deleteResult = await transaction.query(
      `
      DELETE FROM account_verification_tokens
      WHERE token_id = $1
      `,
      [tokenId],
    );

    if (deleteResult.rowCount === 0) {
      await transaction.query("ROLLBACK");
      return res.status(400).json({
        message: "Invalid verification token",
      });
    }

    await transaction.query("COMMIT");

    return res.status(200).json({
      message: "Account verified successfully",
    });
  } catch (error) {
    await transaction.query("ROLLBACK");
    throw error;
  } finally {
    transaction.release();
  }
});

const login = test(async (req, res) => {
  const { email, password } = req.body;

  const account = await pg.query(
    `SELECT *
     FROM accounts
     WHERE email = $1`,
    [email.trim().toLowerCase()],
  );

  if (account.rows.length < 1) {
    return res.status(401).json({
      message: "Incorrect email or password",
    });
  }

  const user = account.rows[0];

  const verifiedPassword = await verifyPassword(user.password_hash, password);

  if (!verifiedPassword) {
    return res.status(401).json({
      message: "Incorrect email or password",
    });
  }

  if (user.status !== "active") {
    return res.status(403).json({
      message: "Account is not active",
    });
  }

  const sessionId = await createSession(user.account_id, user.customer_id);

  res
    .cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: SESSION_TTL * 1000,
    })
    .status(200)
    .json({
      message: "Account logged in",
    });
});

const logout = test(async (req, res) => {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) {
    return res.status(401).json({
      message: "You are not logged in",
    });
  }

  await deleteSession(sessionId);

  res.clearCookie("sessionId", {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
  });

  res.status(200).json({
    message: "Account logged out",
  });
});

const bootstrap = test(async (req, res) => {
  const { username, email, password } = req.body;

  const existingOwner = await pg.query(
    `SELECT 1
     FROM account_roles ar
     JOIN roles r ON r.role_id = ar.role_id
     WHERE LOWER(r.name) = 'owner'`,
  );

  if (existingOwner.rows.length > 0) {
    return res.status(403).json({
      message: "Administrator already exists",
    });
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  const existingAccount = await pg.query(
    `SELECT account_id FROM accounts WHERE username = $1 OR email = $2`,
    [cleanUsername, cleanEmail],
  );

  if (existingAccount.rows.length > 0) {
    return res.status(409).json({
      message: "Username or email already exists",
    });
  }

  const ownerRoleRes = await pg.query(
    `SELECT role_id FROM roles WHERE LOWER(name) = 'owner' LIMIT 1`,
  );
  const ownerRoleId =
    ownerRoleRes.rows[0]?.role_id || Number(process.env.OWNER_ID) || 9;

  const passwordHash = await hashPassword(password);

  const transaction = await pg.connect();
  try {
    await transaction.query("BEGIN");

    // Serialize concurrent bootstrap attempts by locking the owner role
    await transaction.query(
      `SELECT role_id FROM roles WHERE LOWER(name) = 'owner' FOR UPDATE`,
    );

    const txOwnerCheck = await transaction.query(
      `SELECT 1
       FROM account_roles ar
       JOIN roles r ON r.role_id = ar.role_id
       WHERE LOWER(r.name) = 'owner'`,
    );

    if (txOwnerCheck.rows && txOwnerCheck.rows.length > 0) {
      await transaction.query("ROLLBACK");
      return res.status(403).json({
        message: "Administrator already exists",
      });
    }

    const account = await transaction.query(
      `
      INSERT INTO accounts
        (username, email, password_hash, status, created_at, updated_at)
      VALUES
        ($1, $2, $3, 'active', now(), now())
      RETURNING account_id, username, email, status
      `,
      [cleanUsername, cleanEmail, passwordHash],
    );

    await transaction.query(
      `
      INSERT INTO account_roles (account_id, role_id)
      VALUES ($1, $2)
      `,
      [account.rows[0].account_id, ownerRoleId],
    );

    await transaction.query("COMMIT");

    return res.status(201).json({
      message: "Administrator account created successfully",
      account: account.rows[0],
    });
  } catch (error) {
    await transaction.query("ROLLBACK");
    throw error;
  } finally {
    transaction.release();
  }
});

const resendVerification = test(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const accountRes = await pg.query(
    `SELECT account_id, status FROM accounts WHERE email = $1`,
    [cleanEmail],
  );

  if (accountRes.rows.length === 0) {
    return res.status(404).json({ message: "Account not found" });
  }

  const account = accountRes.rows[0];
  if (account.status !== "pending") {
    return res.status(400).json({ message: "Account is already active or cannot be verified" });
  }

  const rawToken = generateVerificationToken();
  const hashedToken = hashVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const transaction = await pg.connect();
  try {
    await transaction.query("BEGIN");
    await transaction.query(
      `DELETE FROM account_verification_tokens WHERE account_id = $1`,
      [account.account_id],
    );
    await transaction.query(
      `INSERT INTO account_verification_tokens (account_id, token_hash, expires_at, created_at)
       VALUES ($1, $2, $3, now())`,
      [account.account_id, hashedToken, expiresAt],
    );
    await transaction.query("COMMIT");
  } catch (err) {
    await transaction.query("ROLLBACK");
    throw err;
  } finally {
    transaction.release();
  }

  await sendVerificationEmail(cleanEmail, rawToken);

  res.status(200).json({ message: "Verification email resent successfully" });
});

export {
  register,
  verifyAccount,
  resendVerification,
  login,
  logout,
  bootstrap,
};
