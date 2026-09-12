const { randomBytes, createHash } = require("crypto");

const generateVerificationToken = () => {
  return randomBytes(32).toString("hex");
};

const hashVerificationToken = (token) => {
  return createHash("sha256").update(token).digest("hex");
};

module.exports = {
  generateVerificationToken,
  hashVerificationToken,
};
