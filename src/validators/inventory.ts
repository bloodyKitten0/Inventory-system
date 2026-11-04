import { positiveInteger, nonNegativeInteger, nonNegativeNumber } from "./common.js";

const id = {
  params: {
    id: positiveInteger,
  },
};

const create = {
  body: {
    product_id: positiveInteger,
    warehouse_id: positiveInteger,
    quantity: nonNegativeInteger,
  },
};

const update = {
  params: {
    id: positiveInteger,
  },

  body: {
    product_id: positiveInteger,
    warehouse_id: positiveInteger,
    quantity: nonNegativeInteger,
  },
};

const adjust = {
  params: {
    id: positiveInteger,
  },

  body: {
    change: {
      required: true,
      type: "number",
      integer: true,
      notEqual: 0,
    },
  },
};

const lowStock = {
  params: {
    below: nonNegativeNumber,
  },
};

const checkAvailability = {
  body: {
    quantity: positiveInteger,
    product_id: positiveInteger,
    warehouse_id: positiveInteger,
  },
};

export { id, create, update, adjust, lowStock, checkAvailability };
