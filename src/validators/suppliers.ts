import { positiveInteger, requiredString, email } from "./common.js";

const create = {
  body: {
    supplier_name: {
      ...requiredString(2, 255),
    },

    supplier_email: email,

    supplier_phone: {
      ...requiredString(3, 50),
    },
  },
};

const update = {
  params: {
    id: positiveInteger,
  },

  body: {
    supplier_name: {
      ...requiredString(2, 255),
    },

    supplier_email: email,

    supplier_phone: {
      ...requiredString(3, 50),
    },
  },
};

const id = {
  params: {
    id: positiveInteger,
  },
};

export { create, update, id };
