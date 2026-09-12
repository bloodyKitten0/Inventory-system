const {
  positiveInteger,
  nonNegativeNumber,
  requiredString,
} = require("./common");

const create = {
  body: {
    name: {
      ...requiredString(1),
    },
    category_id: positiveInteger,
    description: {
      type: "string",
    },
    price: nonNegativeNumber,
  },
};

const update = {
  params: {
    id: positiveInteger,
  },
  body: {
    name: {
      ...requiredString(1),
    },
    category_id: positiveInteger,
    description: {
      type: "string",
    },
    price: nonNegativeNumber,
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
