const { positiveInteger, requiredString, email } = require("./common");

const create = {
  body: {
    customer_name: {
      ...requiredString(2),
    },

    customer_email: email,

    shipping_address: {
      ...requiredString(5),
    },
  },
};

const update = {
  params: {
    id: positiveInteger,
  },

  body: {
    customer_name: {
      ...requiredString(2),
    },

    customer_email: email,

    shipping_address: {
      ...requiredString(5),
    },
  },
};

const id = {
  params: {
    id: positiveInteger,
  },
};

module.exports = {
  create,
  update,
  id,
};
//
