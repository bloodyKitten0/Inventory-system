import { positiveInteger } from "./common.js";
import { ORDER_STATUSES } from "../constants/order-status.js";

const create = {
  body: {
    customer_id: positiveInteger,
    warehouse_id: positiveInteger,
  },
};

const status = {
  required: true,
  type: "string",
  enum: [...ORDER_STATUSES],
};

const update = {
  params: {
    id: positiveInteger,
  },

  body: {
    customer_id: positiveInteger,
    warehouse_id: positiveInteger,
    status,
  },
};

const updateStatus = {
  params: {
    id: positiveInteger,
  },

  body: {
    status,
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

export { create, update, updateStatus, id, customerId };
