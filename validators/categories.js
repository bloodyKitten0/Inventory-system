const { positiveInteger, requiredString } = require("./common");

const create = {
  body: {
    name: {
      ...requiredString(1),
    },

    description: {
      type: "string",
    },
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

    description: {
      type: "string",
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
