const pg = require("../config/db.js");
const {
  generateVerificationToken,
  hashVerificationToken,
} = require("../services/verification-token.js");
const test = require("../services/try-catch.js");
const sendVerificationEmail = require("../services/email.js");
const {
  hashPassword,
  verifyPassword,
} = require("../services/password-hashing.js");
const { createSession, deleteSession } = require("../services/sessions.js");

const register = test(async (req, res) => {
  const { customer_name, username, email, password, shipping_address } =
    req.body;
  if (typeof customer_name !== "string" || customer_name.trim().length < 2) {
    return res.status(400).json({ message: "Invalid customer name" });
  }
  if (
    typeof username !== "string" ||
    username.trim().length < 3 ||
    username.trim().length > 30 ||
    !/^[a-zA-Z0-9_]+$/.test(username.trim())
  ) {
    return res.status(400).json({ message: "Invalid username" });
  }
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({ message: "Invalid email" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
  }
  if (
    typeof shipping_address !== "string" ||
    shipping_address.trim().length < 5
  ) {
    return res.status(400).json({ message: "Invalid shipping address" });
  }
  const cleanUsername = username.trim();
  const cleanEmail = email.trim();
  const cleanCustomerName = customer_name.trim();
  const cleanShippingAddress = shipping_address.trim();

  const existingAccount = await pg.query(
    ` SELECT account_id FROM accounts WHERE username = $1 OR email = $2 `,
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
      ` INSERT INTO customers (customer_name, customer_email, shipping_address, created_at) VALUES ($1, $2, $3, now()) RETURNING id `,
      [cleanCustomerName, cleanEmail, cleanShippingAddress],
    );
    const passwordHash = await hashPassword(password);
    const account = await transaction.query(
      ` INSERT INTO accounts (customer_id, username, email, password_hash, created_at, updated_at) VALUES ($1, $2, $3, $4, now(), now()) RETURNING account_id `,
      [customer.rows[0].id, cleanUsername, cleanEmail, passwordHash],
    );
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const rawToken = generateVerificationToken();
    const hashedToken = hashVerificationToken(rawToken);
    await transaction.query(
      ` INSERT INTO account_verification_tokens (account_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, now()) `,
      [account.rows[0].account_id, hashedToken, expiresAt],
    );
    await transaction.query("COMMIT");
    await sendVerificationEmail(cleanEmail, rawToken);
    return res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    await transaction.query("ROLLBACK");
    throw error;
  } finally {
    transaction.release();
  }
});
const verifyAccount = test(async (req, res) => {
  const token = req.query.token;
  if (typeof token !== "string" || token.length === 0) {
    return res.status(400).json({ message: "Verification token is required" });
  }
  const hashedToken = hashVerificationToken(token);
  const checkToken = await pg.query(
    ` SELECT token_id, account_id, expires_at FROM account_verification_tokens WHERE token_hash = $1 `,
    [hashedToken],
  );
  if (checkToken.rows.length === 0) {
    return res.status(400).json({ message: "Invalid verification token" });
  }
  const accountId = checkToken.rows[0].account_id;
  const expiresAt = checkToken.rows[0].expires_at;
  const tokenId = checkToken.rows[0].token_id;
  if (new Date() >= expiresAt) {
    return res.status(400).json({ message: "Verification token has expired" });
  }
  const transaction = await pg.connect();
  try {
    await transaction.query("BEGIN");
    await transaction.query(
      ` UPDATE accounts SET status = 'active' WHERE account_id = $1 `,
      [accountId],
    );
    await transaction.query(
      ` DELETE FROM account_verification_tokens WHERE token_id = $1 `,
      [tokenId],
    );
    await transaction.query("COMMIT");
    return res.status(200).json({ message: "Account verified successfully" });
  } catch (error) {
    await transaction.query("ROLLBACK");
    throw error;
  } finally {
    transaction.release();
  }
});
const login = test(async (req, res) => {
  const { email, password } = req.body;
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({ message: "Invalid email" });
  }
  if (typeof password !== "string" || password.length === 0) {
    return res.status(400).json({ message: "Password is required" });
  }
  const account = await pg.query(` SELECT * FROM accounts WHERE email = $1 `, [
    email.trim(),
  ]);
  if (account.rows.length < 1) {
    return res.status(401).json({ message: "Incorrect email or password" });
  }
  const user = account.rows[0];
  const verifiedPassword = await verifyPassword(user.password_hash, password);
  if (!verifiedPassword) {
    return res.status(401).json({ message: "Incorrect email or password" });
  }
  if (user.status !== "active") {
    return res.status(403).json({ message: "Account is not active" });
  }
  const sessionId = await createSession(user.account_id);
  res
    .cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({ message: "Account logged in" });
});
const logout = test(async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return res.status(401).json({ message: "You are not logged in" });
  }
  await deleteSession(sessionId);
  res.clearCookie("sessionId", {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
  });
  res.status(200).json({ message: "Account logged out" });
});

module.exports = { register, verifyAccount, login, logout };
