const { positiveInteger, nonNegativeNumber } = require("./common");

const create = {
  body: {
    product_id: positiveInteger,
    supplier_id: positiveInteger,
    supplier_price: nonNegativeNumber,
  },
};

const update = {
  params: {
    id: positiveInteger,
  },

  body: {
    product_id: positiveInteger,
    supplier_id: positiveInteger,
    supplier_price: nonNegativeNumber,
  },
};

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

const supplierId = {
  params: {
    id: positiveInteger,
  },
};

module.exports = {
  create,
  update,
  id,
  productId,
  supplierId,
};
