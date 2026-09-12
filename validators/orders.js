const { positiveInteger } = require("./common");

const create = {
  body: {
    customer_id: positiveInteger,
    warehouse_id: positiveInteger,
  },
};

const id = {
  params: {
    id: positiveInteger,
  },
};

const customerId = {
  params: {
    id: positiveInteger,
  },
};

module.exports = {
  create,
  id,
  customerId,
};
//
