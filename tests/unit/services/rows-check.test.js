const test = require("node:test");
const assert = require("node:assert/strict");

const checkRow = require("../../../services/rows-check.js");

test("returns true when the result contains one row", () => {
  const result = {
    rows: [{ id: 1 }],
  };

  assert.equal(checkRow(result), true);
});

test("returns true when the result contains multiple rows", () => {
  const result = {
    rows: [{ id: 1 }, { id: 2 }, { id: 3 }],
  };

  assert.equal(checkRow(result), true);
});

test("returns false when the result contains no rows", () => {
  const result = {
    rows: [],
  };

  assert.equal(checkRow(result), false);
});

test("returns false when rows is an empty array regardless of other result properties", () => {
  const result = {
    rows: [],
    rowCount: 0,
    command: "SELECT",
  };

  assert.equal(checkRow(result), false);
});

test("only checks whether at least one row exists", () => {
  const result = {
    rows: [null],
  };

  assert.equal(checkRow(result), true);
});

test("returns true when the result contains a single empty object row", () => {
  const result = {
    rows: [{}],
  };

  assert.equal(checkRow(result), true);
});
