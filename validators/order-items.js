const { positiveInteger, nonNegativeNumber } = require("./common");

const create = {
  body: {
    order_id: positiveInteger,

    product_id: positiveInteger,

    quantity: {
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

module.exports = {
  create,
  update,
  id,
};
