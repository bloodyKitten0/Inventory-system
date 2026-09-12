const { hash, verify } = require("argon2");

const hashPassword = (password) => {
  return hash(password);
};

const verifyPassword = (storedHash, password) => {
  return verify(storedHash, password);
};

module.exports = { hashPassword, verifyPassword };
