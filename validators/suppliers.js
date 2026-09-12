const { positiveInteger, requiredString, email } = require("./common");

const create = {
  body: {
    supplier_name: {
      ...requiredString(2),
    },

    supplier_email: email,

    supplier_phone: {
      ...requiredString(3),
    },
  },
};

const update = {
  params: {
    id: positiveInteger,
  },

  body: {
    supplier_name: {
      ...requiredString(2),
    },

    supplier_email: email,

    supplier_phone: {
      ...requiredString(3),
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
