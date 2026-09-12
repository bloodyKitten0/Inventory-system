const test = require("node:test");
const assert = require("node:assert/strict");

const {
  hashPassword,
  verifyPassword,
} = require("../../../services/password-hashing.js");

test("hashPassword returns a hash different from the plaintext password", async () => {
  const password = "CorrectPassword123!";

  const hashedPassword = await hashPassword(password);

  assert.equal(typeof hashedPassword, "string");
  assert.notEqual(hashedPassword, password);
});

test("hashPassword produces an Argon2 hash", async () => {
  const password = "CorrectPassword123!";

  const hashedPassword = await hashPassword(password);

  assert.match(hashedPassword, /^\$argon2/);
});

test("hashPassword produces a valid hash that can be verified", async () => {
  const password = "CorrectPassword123!";

  const hashedPassword = await hashPassword(password);

  const result = await verifyPassword(hashedPassword, password);

  assert.equal(result, true);
});

test("hashPassword produces different hashes for the same password", async () => {
  const password = "CorrectPassword123!";

  const firstHash = await hashPassword(password);
  const secondHash = await hashPassword(password);

  assert.notEqual(firstHash, secondHash);
});

test("verifyPassword returns true for the correct password", async () => {
  const password = "CorrectPassword123!";

  const hashedPassword = await hashPassword(password);

  const result = await verifyPassword(hashedPassword, password);

  assert.equal(result, true);
});

test("verifyPassword returns false for an incorrect password", async () => {
  const password = "CorrectPassword123!";
  const incorrectPassword = "WrongPassword123!";

  const hashedPassword = await hashPassword(password);

  const result = await verifyPassword(hashedPassword, incorrectPassword);

  assert.equal(result, false);
});

test("verifyPassword rejects an invalid hash", async () => {
  await assert.rejects(verifyPassword("not-a-valid-argon2-hash", "password"));
});

test("verifyPassword is asynchronous", async () => {
  const password = "CorrectPassword123!";

  const hashedPassword = await hashPassword(password);

  const result = verifyPassword(hashedPassword, password);

  assert.equal(result instanceof Promise, true);

  assert.equal(await result, true);
});
//
