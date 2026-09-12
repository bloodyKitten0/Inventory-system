const test = require("node:test");
const assert = require("node:assert/strict");

const {
  generateVerificationToken,
  hashVerificationToken,
} = require("../../../services/verification-token.js");

test("generateVerificationToken returns a string", () => {
  const token = generateVerificationToken();

  assert.equal(typeof token, "string");
});

test("generateVerificationToken returns a 64-character hexadecimal token", () => {
  const token = generateVerificationToken();

  assert.equal(token.length, 64);
  assert.match(token, /^[a-f0-9]{64}$/);
});

test("generateVerificationToken generates different tokens", () => {
  const firstToken = generateVerificationToken();
  const secondToken = generateVerificationToken();

  assert.notEqual(firstToken, secondToken);
});

test("hashVerificationToken returns a string", () => {
  const token = generateVerificationToken();

  const hash = hashVerificationToken(token);

  assert.equal(typeof hash, "string");
});

test("hashVerificationToken returns a 64-character hexadecimal SHA-256 hash", () => {
  const token = "test-token";

  const hash = hashVerificationToken(token);

  assert.equal(hash.length, 64);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test("hashVerificationToken is deterministic", () => {
  const token = "same-token";

  const firstHash = hashVerificationToken(token);
  const secondHash = hashVerificationToken(token);

  assert.equal(firstHash, secondHash);
});

test("different tokens produce different hashes", () => {
  const firstHash = hashVerificationToken("token-one");
  const secondHash = hashVerificationToken("token-two");

  assert.notEqual(firstHash, secondHash);
});

test("hashVerificationToken does not return the original token", () => {
  const token = "my-verification-token";

  const hash = hashVerificationToken(token);

  assert.notEqual(hash, token);
});

test("hashVerificationToken correctly hashes an empty string", () => {
  const hash = hashVerificationToken("");

  assert.equal(hash.length, 64);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test("hashVerificationToken correctly handles long tokens", () => {
  const token = "a".repeat(10000);

  const hash = hashVerificationToken(token);

  assert.equal(hash.length, 64);
  assert.match(hash, /^[a-f0-9]{64}$/);
});
//
