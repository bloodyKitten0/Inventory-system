const { positiveInteger, requiredString } = require("./common");

const create = {
  body: {
    name: {
      ...requiredString(2),
    },

    location: {
      ...requiredString(2),
    },
  },
};

const update = {
  params: {
    id: positiveInteger,
  },

  body: {
    name: {
      ...requiredString(2),
    },

    location: {
      ...requiredString(2),
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
