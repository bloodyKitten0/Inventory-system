import { positiveInteger, nonNegativeNumber } from "./common.js";

const id = {
  params: {
    id: positiveInteger,
  },
};

const create = {
  body: {
    product_id: positiveInteger,
    warehouse_id: positiveInteger,
    quantity: nonNegativeNumber,
  },
};

const update = {
  params: {
    id: positiveInteger,
  },

  body: {
    product_id: positiveInteger,
    warehouse_id: positiveInteger,
    quantity: nonNegativeNumber,
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
      finite: true,
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
    quantity: nonNegativeNumber,
    product_id: positiveInteger,
    warehouse_id: positiveInteger,
  },
};

export { id, create, update, adjust, lowStock, checkAvailability };
