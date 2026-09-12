const { positiveInteger } = require("./common");

const id = {
  params: {
    id: positiveInteger,
  },
};

const productId = {
  params: {
    id: positiveInteger,
  },
};

const warehouseId = {
  params: {
    id: positiveInteger,
  },
};

module.exports = {
  id,
  productId,
  warehouseId,
};
//
