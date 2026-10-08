import { positiveInteger, requiredString } from "./common.js";

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

export { create, update, id };
