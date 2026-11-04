import { positiveInteger, nonNegativeNumber } from "./common.js";

const create = {
  body: {
    order_id: positiveInteger,

    product_id: positiveInteger,

    quantity: {
      required: true,
      type: "number",
      integer: true,
      min: 1,
    },

    price: nonNegativeNumber,
  },
};

const update = {
  params: {
    id: positiveInteger,
  },

  body: {
    quantity: {
      required: true,
      type: "number",
      integer: true,
      min: 1,
    },

    price: nonNegativeNumber,
  },
};

const id = {
  params: {
    id: positiveInteger,
  },
};

export { create, update, id };
