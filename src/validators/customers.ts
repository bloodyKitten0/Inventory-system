import { positiveInteger, requiredString, email } from "./common.js";

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

export { create, update, id };
