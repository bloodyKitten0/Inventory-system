const { requiredString, email } = require("./common");

const username = {
  type: "string",
  minLength: 3,
  maxLength: 30,
  pattern: /^[a-zA-Z0-9_]+$/,
};

const password = {
  type: "string",
  minLength: 8,
};

const register = {
  body: {
    customer_name: {
      ...requiredString(2),
    },

    username,

    email,

    password,

    shipping_address: {
      ...requiredString(5),
    },
  },
};

const login = {
  body: {
    email,
    password: {
      ...requiredString(1),
    },
  },
};

const verifyAccount = {
  query: {
    token: {
      ...requiredString(1),
    },
  },
};

module.exports = {
  register,
  login,
  verifyAccount,
};
//
