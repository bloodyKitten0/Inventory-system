import { positiveInteger, requiredString } from "./common.js";

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

export { create, update, id };
