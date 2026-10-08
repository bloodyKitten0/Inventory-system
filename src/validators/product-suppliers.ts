import {
  positiveInteger,
  nonNegativeNumber,
  requiredString,
} from "./common.js";

const create = {
  body: {
    product_id: positiveInteger,
    supplier_id: positiveInteger,
    supplier_price: nonNegativeNumber,
    supplier_sku: requiredString(1),
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
    supplier_sku: requiredString(1),
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

export { create, update, id, productId, supplierId };
